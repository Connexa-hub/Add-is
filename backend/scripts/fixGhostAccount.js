
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const EMAIL = 'connexaaddis@gmail.com';

// Replace these with values from Monnify Dashboard
const ACTUAL_ACCOUNT_REFERENCE = 'REPLACE_WITH_ACTUAL_REFERENCE_FROM_DASHBOARD';
const ACCOUNT_NUMBER = 'REPLACE_WITH_ACCOUNT_NUMBER';
const ACCOUNT_NAME = 'Lenient Israel';
const BANK_NAME = 'REPLACE_WITH_BANK_NAME'; // e.g., "Moniepoint Microfinance Bank"
const BANK_CODE = 'REPLACE_WITH_BANK_CODE'; // e.g., "50515"

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: EMAIL });
    
    if (!user) {
      console.error(`❌ User not found: ${EMAIL}`);
      process.exit(1);
    }

    console.log(`📝 Updating user: ${user.email} (${user._id})`);
    
    user.monnifyAccountReference = ACTUAL_ACCOUNT_REFERENCE;
    user.monnifyAccounts = [{
      accountNumber: ACCOUNT_NUMBER,
      accountName: ACCOUNT_NAME,
      bankName: BANK_NAME,
      bankCode: BANK_CODE,
      reservationReference: ACTUAL_ACCOUNT_REFERENCE,
      collectionChannel: 'RESERVED_ACCOUNT'
    }];
    
    await user.save();
    
    console.log('✅ Account synced successfully!');
    console.log('\nUpdated data:');
    console.log(`  Reference: ${user.monnifyAccountReference}`);
    console.log(`  Bank: ${user.monnifyAccounts[0].bankName}`);
    console.log(`  Account: ${user.monnifyAccounts[0].accountNumber}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
