const VTUProduct = require('../models/VTUProduct');
const QuickAmountGrid = require('../models/QuickAmountGrid');
const ScreenContent = require('../models/ScreenContent');
const { detectNetwork } = require('../utils/phoneDetector');

const getProducts = async (req, res) => {
  try {
    const { type, network, category, search, popular } = req.query;

    const query = { isActive: true };

    if (type) query.type = type;
    if (network) query.network = network;
    if (category) query.category = category;
    if (popular === 'true') query.isPopular = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await VTUProduct.find(query)
      .sort({ displayOrder: 1, isPopular: -1, price: 1 })
      .limit(100);

    const grouped = products.reduce((acc, product) => {
      const cat = product.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        products,
        grouped,
        total: products.length
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

const detectPhoneNetwork = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = detectNetwork(phone);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.error || 'Invalid phone number',
        data: result
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Detect network error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect network',
      error: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (!productData.title || !productData.type || !productData.network || !productData.price || !productData.vendorCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, type, network, price, vendorCode'
      });
    }

    const product = await VTUProduct.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await VTUProduct.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await VTUProduct.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

const listAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const products = await VTUProduct.find()
      .sort({ type: 1, network: 1, displayOrder: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await VTUProduct.countDocuments();

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list products',
      error: error.message
    });
  }
};

const getProvidersByService = async (req, res) => {
  try {
    const { serviceType, category } = req.params;
    const searchCategory = serviceType || category;

    if (!searchCategory) {
      return res.status(400).json({
        success: false,
        message: 'Service type or category is required'
      });
    }

    const products = await VTUProduct.find({
      category: searchCategory,
      isActive: true
    });

    const providersMap = new Map();
    
    products.forEach(product => {
      const providerId = product.serviceID || product.network?.toLowerCase();
      if (providerId && !providersMap.has(providerId)) {
        providersMap.set(providerId, {
          id: providerId,
          name: product.network,
          serviceID: product.serviceID,
          category: product.category,
          type: product.type,
          productCount: 1
        });
      } else if (providerId) {
        const existing = providersMap.get(providerId);
        existing.productCount += 1;
      }
    });

    const providers = Array.from(providersMap.values());

    res.json({
      success: true,
      data: {
        providers,
        total: providers.length
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
};

const getQuickAmounts = async (req, res) => {
  try {
    const { provider, serviceType } = req.params;

    const query = {
      isActive: true
    };

    if (provider) query.provider = provider;
    if (serviceType) query.serviceType = serviceType;

    const quickAmountGrid = await QuickAmountGrid.findOne(query);

    if (!quickAmountGrid) {
      return res.json({
        success: true,
        data: {
          amounts: [100, 200, 500, 1000, 2000, 5000],
          layout: { columns: 3, rows: 2 },
          minAmount: 50,
          maxAmount: 1000000,
          allowCustomInput: true
        }
      });
    }

    res.json({
      success: true,
      data: {
        amounts: quickAmountGrid.amounts,
        layout: quickAmountGrid.layout,
        minAmount: quickAmountGrid.minAmount,
        maxAmount: quickAmountGrid.maxAmount,
        allowCustomInput: quickAmountGrid.allowCustomInput,
        provider: quickAmountGrid.provider,
        serviceType: quickAmountGrid.serviceType
      }
    });
  } catch (error) {
    console.error('Get quick amounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick amounts',
      error: error.message
    });
  }
};

const createQuickAmountGrid = async (req, res) => {
  try {
    const gridData = req.body;

    if (!gridData.serviceType || !gridData.provider || !gridData.providerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serviceType, provider, providerId'
      });
    }

    if (!gridData.amounts || !Array.isArray(gridData.amounts) || gridData.amounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amounts array is required and cannot be empty'
      });
    }

    const existingGrid = await QuickAmountGrid.findOne({
      serviceType: gridData.serviceType,
      provider: gridData.provider
    });

    if (existingGrid) {
      return res.status(409).json({
        success: false,
        message: 'Quick amount grid already exists for this service/provider combination'
      });
    }

    if (req.user && req.user.id) {
      gridData.createdBy = req.user.id;
    }

    const grid = await QuickAmountGrid.create(gridData);

    res.status(201).json({
      success: true,
      message: 'Quick amount grid created successfully',
      data: grid
    });
  } catch (error) {
    console.error('Create quick amount grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quick amount grid',
      error: error.message
    });
  }
};

const updateQuickAmountGrid = async (req, res) => {
  try {
    const { gridId } = req.params;
    const updates = req.body;

    if (req.user && req.user.id) {
      updates.updatedBy = req.user.id;
    }

    const grid = await QuickAmountGrid.findByIdAndUpdate(
      gridId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Quick amount grid not found'
      });
    }

    res.json({
      success: true,
      message: 'Quick amount grid updated successfully',
      data: grid
    });
  } catch (error) {
    console.error('Update quick amount grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quick amount grid',
      error: error.message
    });
  }
};

const deleteQuickAmountGrid = async (req, res) => {
  try {
    const { gridId } = req.params;

    const grid = await QuickAmountGrid.findByIdAndDelete(gridId);

    if (!grid) {
      return res.status(404).json({
        success: false,
        message: 'Quick amount grid not found'
      });
    }

    res.json({
      success: true,
      message: 'Quick amount grid deleted successfully'
    });
  } catch (error) {
    console.error('Delete quick amount grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quick amount grid',
      error: error.message
    });
  }
};

const listQuickAmountGrids = async (req, res) => {
  try {
    const grids = await QuickAmountGrid.find()
      .sort({ serviceType: 1, provider: 1 });

    res.json({
      success: true,
      data: {
        grids,
        total: grids.length
      }
    });
  } catch (error) {
    console.error('List quick amount grids error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list quick amount grids',
      error: error.message
    });
  }
};

const getScreenContent = async (req, res) => {
  try {
    const { screenName } = req.params;

    const now = new Date();
    const query = {
      screenName: screenName || 'global',
      isActive: true,
      $or: [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
      ],
      $and: [
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]
        }
      ]
    };

    const content = await ScreenContent.find(query)
      .sort({ priority: -1, displayOrder: 1 });

    res.json({
      success: true,
      data: {
        content,
        total: content.length
      }
    });
  } catch (error) {
    console.error('Get screen content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch screen content',
      error: error.message
    });
  }
};

const createScreenContent = async (req, res) => {
  try {
    const contentData = req.body;

    if (!contentData.screenName || !contentData.contentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: screenName, contentType'
      });
    }

    if (req.user && req.user.id) {
      contentData.createdBy = req.user.id;
    }

    const content = await ScreenContent.create(contentData);

    res.status(201).json({
      success: true,
      message: 'Screen content created successfully',
      data: content
    });
  } catch (error) {
    console.error('Create screen content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create screen content',
      error: error.message
    });
  }
};

const updateScreenContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const updates = req.body;

    if (req.user && req.user.id) {
      updates.updatedBy = req.user.id;
    }

    const content = await ScreenContent.findByIdAndUpdate(
      contentId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Screen content not found'
      });
    }

    res.json({
      success: true,
      message: 'Screen content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Update screen content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update screen content',
      error: error.message
    });
  }
};

const deleteScreenContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await ScreenContent.findByIdAndDelete(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Screen content not found'
      });
    }

    res.json({
      success: true,
      message: 'Screen content deleted successfully'
    });
  } catch (error) {
    console.error('Delete screen content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete screen content',
      error: error.message
    });
  }
};

const listScreenContent = async (req, res) => {
  try {
    const { screenName, contentType } = req.query;
    const query = {};

    if (screenName) query.screenName = screenName;
    if (contentType) query.contentType = contentType;

    const content = await ScreenContent.find(query)
      .sort({ screenName: 1, priority: -1, displayOrder: 1 });

    res.json({
      success: true,
      data: {
        content,
        total: content.length
      }
    });
  } catch (error) {
    console.error('List screen content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list screen content',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  detectPhoneNetwork,
  createProduct,
  updateProduct,
  deleteProduct,
  listAllProducts,
  getProvidersByService,
  getQuickAmounts,
  createQuickAmountGrid,
  updateQuickAmountGrid,
  deleteQuickAmountGrid,
  listQuickAmountGrids,
  getScreenContent,
  createScreenContent,
  updateScreenContent,
  deleteScreenContent,
  listScreenContent
};
