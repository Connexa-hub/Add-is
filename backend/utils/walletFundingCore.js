const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const monnifyClient = require('./monnifyClient');
const { v4: uuidv4 } = require('uuid');
const { postSimpleTransfer } = require('./ledger');

/**
 * Single source of truth for Monnify wallet funding — initialize, verify,
 * and webhook handling.
 *
 * Consolidated (2026-07-22, Phase 3) from two independent, fully duplicated
 * implementations that had been running simultaneously since before Phase 1:
 * backend/controllers/paymentController.js (mounted at /api/payment) and
 * backend/controllers/walletFundingController.js (mounted at
 * /api/wallet/funding). Both had their own webhook endpoint, both had their
 * own copy of the atomic-claim race-condition fix from Phase 1, and any bug
 * fixed in one silently stayed broken in the other. This file is now the
 * only place that logic lives; both controllers are thin wrappers that call
 * into it and shape the response for their own existing API contract, so
 * neither route breaks for existing clients (including whichever webhook
 * URL is actually configured in Monnify's dashboard — this repo has no way
 * to know that from the outside, so BOTH webhook endpoints stay live and
 * both now run the exact same code).
 */

class FundingError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** Start a new funding transaction and get a Monnify checkout URL. */
async function coreInitializeFunding(userId, amount) {
  if (!amount || amount < 100) {
    throw new FundingError('Amount must be at least ₦100', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new FundingError('User not found', 404);
  }

  const paymentReference = `WF-${Date.now()}-${uuidv4().slice(0, 8)}`;

  const transaction = await Transaction.create({
    user: userId,
    userId,
    type: 'credit',
    category: 'wallet_funding',
    transactionType: 'wallet_funding',
    amount: parseFloat(amount),
    balanceBefore: user.walletBalance,
    reference: paymentReference,
    paymentReference,
    paymentGateway: 'monnify',
    status: 'pending',
    description: 'Wallet funding via Monnify'
  });

  const monnifyResponse = await monnifyClient.initializeTransaction({
    amount: parseFloat(amount),
    customerName: user.name,
    customerEmail: user.email,
    paymentReference,
    paymentDescription: 'Wallet Funding',
    redirectUrl: process.env.PAYMENT_REDIRECT_URL || process.env.FRONTEND_URL || ''
  });

  if (!monnifyResponse.success || !monnifyResponse.data) {
    throw new FundingError('Failed to initialize payment with Monnify', 502);
  }

  const monnifyData = monnifyResponse.data;
  transaction.monnifyTransactionReference = monnifyData.transactionReference || monnifyData.paymentReference;
  transaction.monnifyPaymentReference = monnifyData.paymentReference;
  await transaction.save();

  return { transaction, monnifyData };
}

/** Find a funding transaction by any of the reference fields we've ever used
 * across both legacy implementations, scoped to one user. */
async function findFundingTransaction(userId, referenceCandidate) {
  return Transaction.findOne({
    userId,
    $or: [
      { reference: referenceCandidate },
      { paymentReference: referenceCandidate },
      { monnifyTransactionReference: referenceCandidate },
      { monnifyPaymentReference: referenceCandidate }
    ]
  });
}

/** Re-check a transaction's status with Monnify and credit the wallet if
 * paid. Atomic claim-before-credit, as established in Phase 1. */
async function coreVerifyFunding(userId, referenceCandidate) {
  const transaction = await findFundingTransaction(userId, referenceCandidate);
  if (!transaction) {
    throw new FundingError('Transaction not found', 404);
  }

  if (transaction.status === 'completed') {
    return { status: 'completed', transaction, newBalance: undefined, alreadyProcessed: true };
  }

  const referenceToVerify = transaction.monnifyTransactionReference || transaction.monnifyPaymentReference;
  if (!referenceToVerify) {
    throw new FundingError('Invalid transaction - no Monnify reference found', 400);
  }

  const verification = await monnifyClient.verifyTransaction(referenceToVerify);

  if (!verification.isPaid) {
    const isPending = ['PENDING', 'INITIATED'].includes(verification.status);
    if (!isPending && verification.status === 'FAILED') {
      await Transaction.updateOne({ _id: transaction._id }, { $set: { status: 'failed' } });
    }
    return { status: isPending ? 'pending' : 'not_paid', transaction, isPending };
  }

  const paidAmount = verification.amount;
  if (Math.abs(paidAmount - transaction.amount) > 0.01) {
    console.error(`Funding amount mismatch: expected ${transaction.amount}, got ${paidAmount}`);
    throw new FundingError('Payment amount mismatch', 400);
  }

  // Atomically claim: only the caller that flips pending -> completed
  // proceeds to credit the wallet. Protects against this running twice
  // (a client /verify racing the webhook for the same reference).
  const claimed = await Transaction.findOneAndUpdate(
    { _id: transaction._id, status: { $ne: 'completed' } },
    { $set: { status: 'completed', completedAt: new Date(), metadata: verification.data } },
    { new: false }
  );

  if (!claimed || claimed.status === 'completed') {
    const current = await Transaction.findById(transaction._id);
    return { status: 'completed', transaction: current, alreadyProcessed: true };
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: paidAmount } },
    { new: true }
  );
  await Transaction.updateOne(
    { _id: transaction._id },
    { $set: { balanceAfter: updatedUser.walletBalance, amount: paidAmount } }
  );

  await Notification.create({
    userId,
    title: 'Wallet Funded',
    message: `Your wallet has been credited with ₦${paidAmount.toLocaleString()}`,
    type: 'success',
    actionType: 'wallet',
    actionData: { transactionId: transaction._id }
  });

  // Ledger posting is audit-trail alongside walletBalance (still the
  // authoritative field the app reads — see models/LedgerEntry.js). A
  // ledger-write failure must never undo or block a funding that Monnify
  // has already confirmed and that the user has already been credited for
  // — log loudly for manual reconciliation instead of failing the request.
  try {
    await postSimpleTransfer(transaction._id, {
      fromAccountType: 'system',
      fromAccountRef: 'monnify_settlement',
      toAccountType: 'user_wallet',
      toAccountRef: userId,
      amount: paidAmount,
      description: 'Wallet funding via Monnify (verify)'
    });
  } catch (ledgerErr) {
    console.error('LEDGER POSTING FAILED for funding transaction', transaction._id, ledgerErr);
  }

  const cardData = verification.data.paymentMethod === 'CARD' ? {
    cardToken: verification.data.cardToken,
    last4: verification.data.cardNumber?.slice(-4),
    brand: verification.data.cardType?.toLowerCase(),
    expiryMonth: verification.data.expiryMonth,
    expiryYear: verification.data.expiryYear,
    authorizationCode: verification.data.authorizationCode,
    bin: verification.data.cardNumber?.slice(0, 6)
  } : null;

  const finalTransaction = await Transaction.findById(transaction._id);
  return { status: 'completed', transaction: finalTransaction, newBalance: updatedUser.walletBalance, cardData };
}

/** Process a Monnify webhook payload. Signature must already have been
 * verified by the caller (both route handlers do this before calling in,
 * since the raw signature header name/casing can differ slightly by
 * framework layer and each route wants control over its own 401 response). */
async function coreProcessMonnifyWebhook(eventType, eventData) {
  if (eventType !== 'SUCCESSFUL_TRANSACTION') {
    return { handled: false, message: 'Event acknowledged' };
  }

  const { paymentReference, amountPaid, paidOn, transactionReference } = eventData;

  const transaction = await Transaction.findOne({
    $or: [
      { reference: paymentReference },
      { reference: transactionReference },
      { paymentReference: paymentReference },
      { monnifyTransactionReference: transactionReference },
      { monnifyPaymentReference: paymentReference }
    ]
  });

  if (!transaction) {
    console.log('Webhook: transaction not found for reference:', paymentReference);
    return { handled: false, message: 'Transaction not found, but acknowledged' };
  }

  if (transaction.status === 'completed') {
    return { handled: false, message: 'Transaction already processed' };
  }

  if (Math.abs(amountPaid - transaction.amount) > 0.01) {
    console.error(`Webhook amount mismatch: expected ${transaction.amount}, got ${amountPaid}`);
    await Transaction.updateOne(
      { _id: transaction._id },
      { $set: { metadata: { ...transaction.metadata, webhookData: eventData, amountMismatch: true } } }
    );
    return { handled: false, message: 'Amount mismatch logged' };
  }

  // Atomic claim — safe against Monnify retrying the webhook, and against
  // this racing a client-initiated /verify call for the same reference.
  const claimed = await Transaction.findOneAndUpdate(
    { _id: transaction._id, status: { $ne: 'completed' } },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(paidOn || Date.now()),
        metadata: { ...transaction.metadata, webhookData: eventData }
      }
    },
    { new: false }
  );

  if (!claimed || claimed.status === 'completed') {
    return { handled: false, message: 'Already processed' };
  }

  const updatedUser = await User.findByIdAndUpdate(
    transaction.userId || transaction.user,
    { $inc: { walletBalance: amountPaid } },
    { new: true }
  );
  if (!updatedUser) {
    console.error('Webhook: user not found for transaction', transaction._id);
    return { handled: false, message: 'User not found, acknowledged' };
  }
  await Transaction.updateOne(
    { _id: transaction._id },
    { $set: { balanceAfter: updatedUser.walletBalance, amount: amountPaid } }
  );

  await Notification.create({
    userId: updatedUser._id,
    title: 'Wallet Funded',
    message: `Your wallet has been credited with ₦${amountPaid.toLocaleString()}`,
    type: 'success',
    actionType: 'wallet',
    actionData: { transactionId: transaction._id }
  });

  try {
    await postSimpleTransfer(transaction._id, {
      fromAccountType: 'system',
      fromAccountRef: 'monnify_settlement',
      toAccountType: 'user_wallet',
      toAccountRef: updatedUser._id,
      amount: amountPaid,
      description: 'Wallet funding via Monnify (webhook)'
    });
  } catch (ledgerErr) {
    console.error('LEDGER POSTING FAILED for webhook transaction', transaction._id, ledgerErr);
  }

  console.log(`Wallet funding completed via webhook: ${transaction._id}`);
  return { handled: true, message: 'Webhook processed successfully' };
}

module.exports = {
  FundingError,
  coreInitializeFunding,
  coreVerifyFunding,
  coreProcessMonnifyWebhook,
  findFundingTransaction
};
