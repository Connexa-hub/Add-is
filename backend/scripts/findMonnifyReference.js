const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const monnifyClient = require('../utils/monnifyClient');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function findMonnifyReference() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined.');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const testEmail = 'akinadeisrael5@gmail.com';
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${testEmail}`);
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TRYING DIFFERENT ACCOUNT REFERENCE FORMATS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try different possible reference formats
    const possibleReferences = [
      `USER_${user._id}`,                           // Current format
      `user_${user._id}`,                           // Lowercase
      `${user._id}`,                                // Just the ID
      `USER_${user._id}_${user.email}`,             // With email
      `${user.email}`,                              // Just email
      user.monnifyAccountReference,                 // Stored reference (if exists)
    ].filter(Boolean);

    console.log(`Testing ${possibleReferences.length} possible reference formats:\n`);

    for (const ref of possibleReferences) {
      console.log(`\n🔍 Trying: "${ref}"`);
      
      try {
        const result = await monnifyClient.getReservedAccountDetails(ref);
        
        if (result.success && result.data && result.data.accounts) {
          console.log('✅ ✅ ✅ FOUND IT! ✅ ✅ ✅');
          console.log(`\nCorrect Account Reference: "${ref}"`);
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📥 ACCOUNT DETAILS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(JSON.stringify(result.data, null, 2));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          // Save to database
          const accounts = result.data.accounts || [];
          if (accounts.length > 0) {
            user.monnifyAccountReference = ref;
            user.monnifyAccounts = accounts.map(acc => ({
              accountNumber: acc.accountNumber,
              accountName: acc.accountName,
              bankName: acc.bankName,
              bankCode: acc.bankCode,
              reservationReference: acc.reservationReference,
              collectionChannel: acc.collectionChannel,
            }));
            await user.save();
            
            console.log(`✅ Saved ${accounts.length} account(s) to database for ${testEmail}`);
            accounts.forEach((acc, idx) => {
              console.log(`   ${idx + 1}. ${acc.bankName}: ${acc.accountNumber}`);
            });
          }
          
          process.exit(0);
        } else {
          console.log(`   ❌ Not found with this reference`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ NONE OF THE REFERENCES WORKED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nPOSSIBLE REASONS:');
    console.log('1. Account was created with a completely different reference format');
    console.log('2. Account might be under a different customer email');
    console.log('3. Account might have been deleted from Monnify');
    console.log('4. Monnify sandbox data might have been reset');
    console.log('\nRECOMMENDATION:');
    console.log('Check Monnify dashboard for customer: akinadeisrael5@gmail.com');
    console.log('Or create a fresh account with the standard reference format.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

findMonnifyReference();
