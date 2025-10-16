// File: /addis-app/backend/controllers/serviceController.js
const Transaction = require('../models/Transaction');
const { requestVTPass } = require('../utils/vtpassClient');

exports.subscribeTV = async (req, res) => {
  try {
    const { smartcardNumber, variation_code, serviceID } = req.body;
    const result = await requestVTPass(serviceID, {
      billersCode: smartcardNumber,
      variation_code,
      phone: '08011111111'
    });
    await Transaction.create({ userId: req.userId, type: 'TV', transactionType: 'subscription', amount: 0, status: 'success', details: result });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: 'TV subscription failed', error: err.message });
  }
};

exports.buyData = async (req, res) => {
  try {
    const { phoneNumber, variation_code, serviceID } = req.body;
    const result = await requestVTPass(serviceID, {
      phone: phoneNumber,
      variation_code,
      billersCode: phoneNumber
    });
    await Transaction.create({ userId: req.userId, type: 'Data', transactionType: 'purchase', amount: 0, status: 'success', details: result });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: 'Data purchase failed', error: err.message });
  }
};
