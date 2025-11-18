const Transaction = require('../models/Transaction');

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, category, status, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email phone')
      .populate('user', 'name email phone');

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserTransactions = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, category, status, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserRecentTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionByReference = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ 
      reference,
      userId: req.userId 
    }).populate('userId', 'name email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};
