const VTUProduct = require('../models/VTUProduct');
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

module.exports = {
  getProducts,
  detectPhoneNetwork,
  createProduct,
  updateProduct,
  deleteProduct,
  listAllProducts
};
