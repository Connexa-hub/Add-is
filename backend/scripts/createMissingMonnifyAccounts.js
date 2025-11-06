
const mongoose = require('mongoose');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');
require('dotenv').config();

async function createMissingMonnifyAccounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find users without Monnify accounts
    const usersWithoutAccounts = await User.find({
      $or: [
        { monnifyAccounts: { $exists: false } },
        { monnifyAccounts: { $size: 0 } },
        { monnifyAccounts: null }
      ]
    });

    console.log(`Found ${usersWithoutAccounts.length} users without Monnify accounts`);

    for (const user of usersWithoutAccounts) {
      try {
        const accountReference = `USER_${user._id}`;
        console.log(`Creating Monnify account for ${user.email}...`);

        const monnifyResult = await monnifyClient.createReservedAccount({
          accountReference,
          accountName: user.name,
          customerEmail: user.email,
          customerName: user.name,
        });

        if (monnifyResult.success && monnifyResult.data) {
          const accounts = monnifyResult.data.accounts || [];
          user.monnifyAccountReference = accountReference;
          user.monnifyAccounts = accounts.map(acc => ({
            accountNumber: acc.accountNumber,
            accountName: acc.accountName,
            bankName: acc.bankName,
            bankCode: acc.bankCode,
          }));
          await user.save();
          console.log(`✓ Created accounts for ${user.email}:`, user.monnifyAccounts);
        } else {
          console.log(`✗ Failed for ${user.email}:`, monnifyResult);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error creating account for ${user.email}:`, error.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

createMissingMonnifyAccounts();
