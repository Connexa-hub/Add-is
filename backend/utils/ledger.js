const mongoose = require('mongoose');
const crypto = require('crypto');
const LedgerEntry = require('../models/LedgerEntry');

/**
 * Post a balanced set of ledger entries atomically (all-or-nothing).
 *
 * @param {string} transactionId - the Transaction document this posting belongs to
 * @param {Array<{accountType: 'user_wallet'|'system', accountRef: string, direction: 'debit'|'credit', amount: number, description?: string}>} legs
 *
 * Validates that debits and credits sum to the same total before writing
 * anything — an unbalanced posting is a bug in the caller, not something to
 * silently write and reconcile later. Uses a MongoDB session/transaction so
 * either all legs land or none do; this requires a replica set, which every
 * real MongoDB Atlas deployment is (including the free M0 tier) — a
 * standalone `mongod` with no replica set will throw on `startTransaction`.
 * If that's ever a real deployment target, this needs a different strategy
 * (e.g. a single document with an array of legs instead of N documents).
 */
async function postLedgerEntries(transactionId, legs) {
  if (!Array.isArray(legs) || legs.length < 2) {
    throw new Error('postLedgerEntries: at least two legs (one debit, one credit) are required');
  }

  const totalDebits = legs.filter(l => l.direction === 'debit').reduce((sum, l) => sum + l.amount, 0);
  const totalCredits = legs.filter(l => l.direction === 'credit').reduce((sum, l) => sum + l.amount, 0);

  if (Math.abs(totalDebits - totalCredits) > 0.001) {
    throw new Error(
      `postLedgerEntries: unbalanced posting for transaction ${transactionId} — ` +
      `debits ${totalDebits} != credits ${totalCredits}`
    );
  }

  const postingId = crypto.randomUUID();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await LedgerEntry.insertMany(
      legs.map(leg => ({
        transactionId,
        postingId,
        accountType: leg.accountType,
        accountRef: String(leg.accountRef),
        direction: leg.direction,
        amount: leg.amount,
        currency: leg.currency || 'NGN',
        description: leg.description
      })),
      { session }
    );
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  return postingId;
}

/** Convenience wrapper for the common case: money moves from one account to
 * exactly one other account (most transfers, funding, purchases). */
async function postSimpleTransfer(transactionId, { fromAccountType, fromAccountRef, toAccountType, toAccountRef, amount, description }) {
  return postLedgerEntries(transactionId, [
    { accountType: fromAccountType, accountRef: fromAccountRef, direction: 'credit', amount, description },
    { accountType: toAccountType, accountRef: toAccountRef, direction: 'debit', amount, description }
  ]);
}
// Note on direction convention: "credit" on the source account means value
// is leaving it (reducing what it owes/holds), "debit" on the destination
// means value is arriving. For a user_wallet account, a debit increases the
// user's balance (money coming in) — this matches how a bank statement
// shows a deposit as a credit *to the customer* but the bank's own books
// record it as a liability increase, which mirrors "debit the cash asset,
// credit the customer liability". Since this ledger doesn't yet model full
// asset/liability account classes (Phase 3 follow-up), the practical rule
// engineers should use here is: **debit = balance increases, credit =
// balance decreases**, applied consistently to whichever account a leg
// targets.

/** Sum of debits minus credits for one account — its ledger balance. */
async function getAccountBalance(accountType, accountRef) {
  const result = await LedgerEntry.aggregate([
    { $match: { accountType, accountRef: String(accountRef) } },
    {
      $group: {
        _id: null,
        debits: { $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] } },
        credits: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] } }
      }
    }
  ]);
  if (!result.length) return 0;
  return result[0].debits - result[0].credits;
}

/** Reconciliation check: across the WHOLE ledger, total debits must equal
 * total credits (every posting is balanced individually, but this catches
 * any posting that bypassed postLedgerEntries and wrote directly). */
async function getGlobalImbalance() {
  const result = await LedgerEntry.aggregate([
    {
      $group: {
        _id: null,
        debits: { $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] } },
        credits: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] } }
      }
    }
  ]);
  if (!result.length) return 0;
  return result[0].debits - result[0].credits;
}

module.exports = {
  postLedgerEntries,
  postSimpleTransfer,
  getAccountBalance,
  getGlobalImbalance
};
