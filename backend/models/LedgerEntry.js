const mongoose = require('mongoose');

// Double-entry ledger. Every money movement in the system should post at
// least two balanced LedgerEntry documents (one debit, one credit) that sum
// to zero — not just mutate `User.walletBalance` in place, which is what
// the rest of the codebase still does today (see ROADMAP.md Phase 3 for the
// migration status; walletBalance and the ledger currently run in parallel,
// walletBalance is what the app actually reads, the ledger is the audit
// trail being built out).
//
// Accounts aren't a separate collection — they're identified by
// (accountType, accountRef) pairs:
//   - accountType 'user_wallet', accountRef = the user's ObjectId as string
//   - accountType 'system', accountRef = a fixed name, e.g.
//     'monnify_settlement', 'vtpass_expense', 'platform_revenue',
//     'cashback_liability'
// This keeps the schema simple while still letting reconciliation sum by
// account: `LedgerEntry.aggregate([...]).match({accountType, accountRef})`.
const LedgerEntrySchema = new mongoose.Schema({
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  // Groups the entries that make up one balanced posting (a debit+credit
  // pair, or more for a multi-leg posting). Lets you fetch "everything that
  // moved together" even though transactionId may be shared across retries.
  postingId: { type: String, required: true, index: true },
  accountType: { type: String, enum: ['user_wallet', 'system'], required: true },
  accountRef: { type: String, required: true }, // userId string, or system account name
  direction: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'NGN' },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

LedgerEntrySchema.index({ accountType: 1, accountRef: 1, createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', LedgerEntrySchema);
