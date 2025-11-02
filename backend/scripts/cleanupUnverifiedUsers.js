const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const cleanupUnverifiedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await User.deleteMany({
      emailVerified: false,
      createdAt: { $lt: oneDayAgo }
    });

    console.log(`✅ Cleanup complete: ${result.deletedCount} unverified accounts removed`);
    
    const expiredVerifications = await User.updateMany(
      {
        emailVerified: false,
        verificationExpires: { $lt: new Date() }
      },
      {
        $set: {
          verificationOTP: null,
          verificationExpires: null
        }
      }
    );

    console.log(`✅ Cleared ${expiredVerifications.modifiedCount} expired verification codes`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  cleanupUnverifiedUsers().then(() => process.exit(0));
}

module.exports = cleanupUnverifiedUsers;
