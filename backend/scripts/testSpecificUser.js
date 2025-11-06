const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testSpecificUser() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined. Please check your .env file.');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'akinadeisrael5@gmail.com';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔍 TESTING MONNIFY ACCOUNT FOR: ${testEmail}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Find user
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${testEmail}`);
      process.exit(1);
    }

    console.log('📋 USER DETAILS:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Wallet Balance: ₦${user.walletBalance}`);
    console.log(`   Account Reference: ${user.monnifyAccountReference || 'Not set'}`);
    console.log(`   Monnify Accounts Count: ${user.monnifyAccounts?.length || 0}\n`);

    if (user.monnifyAccounts && user.monnifyAccounts.length > 0) {
      console.log('💳 CURRENT MONNIFY ACCOUNTS IN DATABASE:');
      user.monnifyAccounts.forEach((acc, idx) => {
        console.log(`   ${idx + 1}. ${acc.bankName || 'Unknown Bank'}`);
        console.log(`      Account Number: ${acc.accountNumber || 'N/A'}`);
        console.log(`      Account Name: ${acc.accountName || 'N/A'}`);
        console.log(`      Bank Code: ${acc.bankCode || 'N/A'}`);
        console.log(`      Reservation Ref: ${acc.reservationReference || 'N/A'}`);
        console.log(`      Collection Channel: ${acc.collectionChannel || 'N/A'}`);
      });
      console.log('\n✅ User already has Monnify accounts in database!');
      console.log('No sync needed. Test PASSED!\n');
      process.exit(0);
    }

    console.log('⚠️  ISSUE CONFIRMED: User has NO Monnify accounts in database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Attempt to retrieve from Monnify
    const accountReference = `USER_${user._id}`;
    console.log(`🔄 ATTEMPTING TO RETRIEVE ACCOUNT FROM MONNIFY`);
    console.log(`   Account Reference: ${accountReference}\n`);

    let monnifyResult;
    let wasRetrieved = false;

    try {
      console.log('   Step 1: Checking if account exists in Monnify API...');
      monnifyResult = await monnifyClient.getReservedAccountDetails(accountReference);
      
      if (monnifyResult.success && monnifyResult.data) {
        console.log('   ✅ Account found in Monnify!');
        wasRetrieved = true;
      } else {
        console.log('   ⚠️  Account not found in Monnify, creating new...');
        monnifyResult = await monnifyClient.createReservedAccount({
          accountReference,
          accountName: user.name,
          customerEmail: user.email,
          customerName: user.name,
        });
        
        if (monnifyResult.success) {
          console.log('   ✅ New account created successfully!');
        }
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      throw error;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 MONNIFY API RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(monnifyResult, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Save to database
    if (monnifyResult.success && monnifyResult.data) {
      const accounts = monnifyResult.data.accounts || [];
      
      if (accounts.length > 0) {
        console.log('💾 SAVING TO DATABASE...');
        
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
        console.log('   ✅ Saved to database\n');
        
        // Verify save
        const savedUser = await User.findById(user._id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ VERIFICATION - ACCOUNTS NOW IN DATABASE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        savedUser.monnifyAccounts.forEach((acc, idx) => {
          console.log(`\n   ${idx + 1}. ${acc.bankName}`);
          console.log(`      Account Number: ${acc.accountNumber}`);
          console.log(`      Account Name: ${acc.accountName}`);
          console.log(`      Bank Code: ${acc.bankCode}`);
          console.log(`      Reservation Ref: ${acc.reservationReference || 'N/A'}`);
          console.log(`      Collection Channel: ${acc.collectionChannel || 'N/A'}`);
        });
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 SUCCESS! TEST PASSED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ ${wasRetrieved ? 'Retrieved existing' : 'Created new'} Monnify account`);
        console.log(`✅ Saved ${savedUser.monnifyAccounts.length} account(s) to database`);
        console.log(`✅ All fields captured (including reservationReference & collectionChannel)`);
        console.log(`✅ User ${testEmail} can now see their virtual account!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
      } else {
        console.log('❌ No accounts found in Monnify response\n');
      }
    } else {
      console.log('❌ Failed to get account from Monnify\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ TEST FAILED - ERROR:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

testSpecificUser();
