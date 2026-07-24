const User = require('../models/User');
const { postSimpleTransfer } = require('./ledger');

/**
 * Atomically reserve (debit) funds from a user's wallet.
 *
 * Replaces the old pattern of "read balance, check it, call the external
 * provider, then decrement balance" — which has a race window where two
 * concurrent requests can both pass the balance check before either debit
 * lands, letting a user overdraft their wallet and get both purchases
 * fulfilled by the upstream provider (VTPass) before the wallet ever goes
 * negative on our side.
 *
 * The balance check and the debit happen in a single atomic MongoDB
 * operation (`walletBalance: { $gte: amount }` in the query filter, `$inc`
 * in the update), so only one of two concurrent requests can ever win.
 *
 * @returns {Promise<{ok: true, user: object} | {ok: false}>}
 *   ok:false means insufficient balance (or user not found) — caller should
 *   respond 400/404 without calling the external provider.
 */
async function reserveWalletFunds(userId, amount) {
  if (!(amount > 0)) {
    throw new Error('reserveWalletFunds: amount must be a positive number');
  }
  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  if (!user) {
    return { ok: false };
  }
  return { ok: true, user };
}

/**
 * Reverse a reservation made by reserveWalletFunds — call this when the
 * upstream provider call fails or errors after funds were already reserved,
 * so the customer isn't charged for a purchase that didn't go through.
 */
async function refundWalletFunds(userId, amount) {
  if (!(amount > 0)) return null;
  return User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: amount } },
    { new: true }
  );
}

/**
 * Atomically apply a cashback balance delta (spend usedCashback, earn
 * cashbackAmount) after a purchase succeeds. Kept separate from the wallet
 * reservation because cashback should only move once we know the purchase
 * actually succeeded.
 */
async function applyCashbackDelta(userId, delta) {
  if (!delta) {
    return User.findById(userId);
  }
  return User.findByIdAndUpdate(
    userId,
    { $inc: { cashbackBalance: delta } },
    { new: true }
  );
}

/**
 * Post a balanced ledger entry for a successful VTU/bill purchase — call
 * this once, after the Transaction document exists and the purchase is
 * confirmed successful (the amount that was actually reserved/debited from
 * the wallet, i.e. after any cashback applied — not the face value of the
 * purchase). Money leaves the user's wallet (credit — balance decreases)
 * and lands in a system expense account representing what's now owed to
 * the upstream provider (debit — balance increases). Same fire-and-log
 * pattern as the funding core: a ledger-write failure must never surface
 * as a failure of the purchase itself, since the customer has already been
 * charged and the provider has already fulfilled the service.
 */
async function postPurchaseLedgerEntry(transactionId, userId, amount, description) {
  if (!(amount > 0)) return; // fully cashback-covered purchases move no wallet funds
  try {
    await postSimpleTransfer(transactionId, {
      fromAccountType: 'user_wallet',
      fromAccountRef: userId,
      toAccountType: 'system',
      toAccountRef: 'vtpass_expense',
      amount,
      description
    });
  } catch (ledgerErr) {
    console.error('LEDGER POSTING FAILED for purchase transaction', transactionId, ledgerErr);
  }
}

module.exports = { reserveWalletFunds, refundWalletFunds, applyCashbackDelta, postPurchaseLedgerEntry };
