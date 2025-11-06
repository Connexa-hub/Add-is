const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function syncExistingMonnifyAccounts() {
  try {
    // Check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined. Please check your .env file.');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with empty monnifyAccounts array
    const usersWithoutAccounts = await User.find({
      $or: [
        { monnifyAccounts: { $exists: false } },
        { monnifyAccounts: { $size: 0 } },
        { monnifyAccounts: null }
      ]
    });

    console.log(`\n📊 Found ${usersWithoutAccounts.length} users without Monnify accounts in database`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let successCount = 0;
    let failureCount = 0;
    let retrievedCount = 0;
    let createdCount = 0;

    for (const user of usersWithoutAccounts) {
      try {
        const accountReference = `USER_${user._id}`;
        console.log(`\n🔄 Processing: ${user.email} (${user.name})`);
        console.log(`   Account Reference: ${accountReference}`);

        let monnifyResult;
        let wasRetrieved = false;
        
        // First, try to retrieve existing account from Monnify
        console.log('   Step 1: Checking if account exists in Monnify...');
        monnifyResult = await monnifyClient.getReservedAccountDetails(accountReference);
        
        if (monnifyResult.success && monnifyResult.data) {
          console.log('   ✅ Found existing account in Monnify!');
          wasRetrieved = true;
          retrievedCount++;
        } else {
          // If not found, try to create (will auto-retrieve if R42 duplicate error)
          console.log('   ⚠️  No existing account found, creating new account...');
          monnifyResult = await monnifyClient.createReservedAccount({
            accountReference,
            accountName: user.name,
            customerEmail: user.email,
            customerName: user.name,
          });
          
          if (monnifyResult.success) {
            console.log('   ✅ New account created successfully!');
            createdCount++;
          }
        }

        // Save account details to database
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
            const action = wasRetrieved ? '🔄 Retrieved & Saved' : '✨ Created & Saved';
            console.log(`   ${action}: ${savedUser.monnifyAccounts.length} account(s)`);
            
            savedUser.monnifyAccounts.forEach((acc, idx) => {
              console.log(`      ${idx + 1}. ${acc.bankName}: ${acc.accountNumber}`);
            });
            
            successCount++;
          } else {
            console.log(`   ⚠️  No accounts found in Monnify response`);
            failureCount++;
          }
        } else {
          console.log(`   ❌ Failed to get account data from Monnify`);
          failureCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`   ❌ Error processing ${user.email}:`, error.message);
        failureCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SYNC SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users Processed: ${usersWithoutAccounts.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`   - Retrieved existing: ${retrievedCount}`);
    console.log(`   - Created new: ${createdCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔄 MONNIFY ACCOUNT SYNC SCRIPT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('This script will:');
console.log('1. Find users without Monnify accounts in database');
console.log('2. Check if accounts exist in Monnify');
console.log('3. Retrieve existing accounts OR create new ones');
console.log('4. Save account details to MongoDB');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

syncExistingMonnifyAccounts();
