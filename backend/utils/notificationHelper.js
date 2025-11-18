const Notification = require('../models/Notification');

const createTransactionNotification = async (userId, transaction, status, details = {}) => {
  try {
    let title, message, type, actionData;

    const serviceName = transaction.transactionType || transaction.category;
    const amount = transaction.amount;
    const reference = transaction.reference;

    switch (status) {
      case 'success':
        title = 'Payment Successful';
        message = `Your ${serviceName} payment of ₦${amount.toLocaleString()} was successful.`;
        type = 'success';
        actionData = {
          reference,
          amount,
          service: serviceName,
          recipient: transaction.recipient,
          status: 'completed',
          balanceAfter: details.newBalance,
          cashbackEarned: details.cashbackEarned || 0,
          cashbackUsed: details.cashbackUsed || 0
        };
        break;

      case 'failed':
        title = 'Payment Failed';
        message = `Your ${serviceName} payment of ₦${amount.toLocaleString()} failed. ${details.errorMessage || 'Please try again.'}`;
        type = 'error';
        actionData = {
          reference,
          amount,
          service: serviceName,
          recipient: transaction.recipient,
          status: 'failed',
          errorMessage: details.errorMessage || 'Transaction failed',
          errorDetails: details.errorDetails
        };
        break;

      case 'pending':
        title = 'Payment Pending';
        message = `Your ${serviceName} payment of ₦${amount.toLocaleString()} is being processed. Reference: ${reference}`;
        type = 'warning';
        actionData = {
          reference,
          amount,
          service: serviceName,
          recipient: transaction.recipient,
          status: 'pending'
        };
        break;

      default:
        return null;
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      actionType: 'transaction',
      actionData
    });

    return notification;
  } catch (error) {
    console.error('Error creating transaction notification:', error);
    return null;
  }
};

const createCashbackNotification = async (userId, cashbackAmount, reference) => {
  try {
    const notification = await Notification.create({
      userId,
      title: 'Cashback Earned!',
      message: `You've earned ₦${cashbackAmount.toFixed(2)} cashback on your transaction`,
      type: 'success',
      actionType: 'cashback',
      actionData: {
        cashbackAmount,
        reference
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating cashback notification:', error);
    return null;
  }
};

module.exports = {
  createTransactionNotification,
  createCashbackNotification
};
