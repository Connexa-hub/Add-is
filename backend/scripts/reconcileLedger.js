const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const { getGlobalImbalance } = require('../utils/ledger');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Reconciliation check: compares each user's ledger-derived wallet balance
 * (sum of their user_wallet debits minus credits) against the authoritative
 * `User.walletBalance` field.
 *
 * Since the ledger was only wired in as of Phase 3 (see ROADMAP.md), any
 * user whose balance moved before that point will show a drift equal to
 * their pre-ledger balance — that's expected, not a bug. What this script
 * is actually for is catching NEW drift going forward: if a future code
 * path mutates walletBalance directly without posting a matching ledger
 * entry (easy mistake — nothing currently stops someone from writing
 * `$inc: {walletBalance: ...}` without importing the ledger helpers), this
 * is how you'd find out.
 *
 * Run manually for now (`node backend/scripts/reconcileLedger.js`).
 * Wiring this into a scheduled job is Phase 7 (background services) —
 * tracked in ROADMAP.md, not done yet.
 *
 * Usage:
 *   node backend/scripts/reconcileLedger.js                  # full report
 *   node backend/scripts/reconcileLedger.js --baseline-file=./baseline.json
 *     # treats the balances in baseline.json (userId -> balance snapshot
 *     # taken right when the ledger went live) as the starting point, so
 *     # only drift SINCE then is flagged. Optional — without it, every
 *     # user with ledger activity but a pre-existing balance will show as
 *     # "drifted", which is expected noise until a baseline is captured.
 */
async function reconcile() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  const baselineArg = process.argv.find(a => a.startsWith('--baseline-file='));
  let baseline = {};
  if (baselineArg) {
    const filePath = baselineArg.split('=')[1];
    baseline = require(path.resolve(filePath));
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('LEDGER RECONCILIATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const globalImbalance = await getGlobalImbalance();
  if (Math.abs(globalImbalance) > 0.01) {
    console.log(`🚨 GLOBAL LEDGER IMBALANCE: ${globalImbalance} — the ledger itself doesn't`);
    console.log('   balance (total debits != total credits across ALL accounts). This should');
    console.log('   be impossible if every posting went through postLedgerEntries/postSimpleTransfer');
    console.log('   (they validate balance before writing) — investigate immediately if non-zero.\n');
  } else {
    console.log('✅ Global ledger is balanced (total debits == total credits)\n');
  }

  // Sum each user's ledger movements in one aggregation rather than N queries.
  const ledgerBalances = await LedgerEntry.aggregate([
    { $match: { accountType: 'user_wallet' } },
    {
      $group: {
        _id: '$accountRef',
        debits: { $sum: { $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0] } },
        credits: { $sum: { $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', 0] } }
      }
    }
  ]);

  const ledgerBalanceByUser = new Map(
    ledgerBalances.map(row => [row._id, row.debits - row.credits])
  );

  const usersWithLedgerActivity = await User.find(
    { _id: { $in: [...ledgerBalanceByUser.keys()] } },
    { walletBalance: 1, email: 1 }
  ).lean();

  let flaggedCount = 0;
  for (const user of usersWithLedgerActivity) {
    const userId = String(user._id);
    const ledgerMovement = ledgerBalanceByUser.get(userId) || 0;
    const baselineBalance = baseline[userId] || 0;
    const expectedBalance = baselineBalance + ledgerMovement;
    const actualBalance = user.walletBalance;
    const drift = actualBalance - expectedBalance;

    if (Math.abs(drift) > 0.01) {
      flaggedCount++;
      console.log(`⚠️  User ${user.email} (${userId})`);
      console.log(`    walletBalance: ${actualBalance}, expected from ledger: ${expectedBalance}, drift: ${drift}`);
    }
  }

  console.log(`\n${usersWithLedgerActivity.length} users have ledger activity; ${flaggedCount} flagged for drift.`);
  if (!baselineArg) {
    console.log('\nNote: no --baseline-file supplied, so drift includes each user\'s pre-ledger');
    console.log('balance (expected/noisy until a baseline snapshot is captured and passed in).');
  }

  await mongoose.disconnect();
  process.exit(flaggedCount > 0 ? 1 : 0);
}

reconcile().catch(err => {
  console.error('Reconciliation script failed:', err);
  process.exit(1);
});
