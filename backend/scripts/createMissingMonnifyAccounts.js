const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function createMissingMonnifyAccounts() {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined. Please check your .env file.');
    }
    
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
        console.log(`Processing Monnify account for ${user.email}...`);

        // createReservedAccount now handles R42 duplicate errors internally
        const monnifyResult = await monnifyClient.createReservedAccount({
          accountReference,
          accountName: user.name,
          customerEmail: user.email,
          customerName: user.name,
        });

        if (monnifyResult.success && monnifyResult.data) {
          const accounts = monnifyResult.data.accounts || [];
          
          if (accounts.length > 0) {
            user.monnifyAccountReference = accountReference;
            user.monnifyAccounts = accounts.map(acc => ({
              accountNumber: acc.accountNumber,
              accountName: acc.accountName,
              bankName: acc.bankName,
              bankCode: acc.bankCode,
              reservationReference: acc.reservationReference,
              collectionChannel: acc.collectionChannel,
            }));
            await user.save();
            
            // Verify the save was successful
            const savedUser = await User.findById(user._id);
            console.log(`✓ Saved ${accounts.length} account(s) for ${user.email}`);
            console.log(`  Accounts:`, savedUser.monnifyAccounts.map(a => `${a.bankName}: ${a.accountNumber}`).join(', '));
            console.log(`  Verification: ${savedUser.monnifyAccounts.length} account(s) confirmed in database`);
          } else {
            console.log(`✗ No accounts found in response for ${user.email}`);
          }
        } else {
          console.log(`✗ Failed for ${user.email}:`, monnifyResult);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing account for ${user.email}:`, error.message);
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
