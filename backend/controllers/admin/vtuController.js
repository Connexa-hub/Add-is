const VTUProduct = require('../../models/VTUProduct');
const vtpassSyncService = require('../../services/vtpassSyncService');

let lastSyncStatus = {
  lastSyncTime: null,
  status: 'idle',
  results: null
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = vtpassSyncService.getServiceCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      category, 
      type,
      network, 
      isActive,
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (network) query.network = { $regex: network, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { vendorCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await VTUProduct.find(query)
      .sort({ category: 1, network: 1, displayOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await VTUProduct.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    
    const existingProduct = await VTUProduct.findOne({
      vendorCode: productData.vendorCode
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this vendor code already exists'
      });
    }
    
    const product = await VTUProduct.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const product = await VTUProduct.findByIdAndUpdate(
      id,
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
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await VTUProduct.findByIdAndDelete(id);
    
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
    next(error);
  }
};

exports.toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await VTUProduct.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.isActive = !product.isActive;
    await product.save();
    
    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { productIds, isActive } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }
    
    const result = await VTUProduct.updateMany(
      { _id: { $in: productIds } },
      { $set: { isActive } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} products updated successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

exports.syncProducts = async (req, res, next) => {
  try {
    const { category } = req.body;
    
    lastSyncStatus.status = 'syncing';
    lastSyncStatus.lastSyncTime = new Date();
    
    let results;
    if (category) {
      results = await vtpassSyncService.syncCategory(category);
    } else {
      results = await vtpassSyncService.syncAllCategories();
    }
    
    lastSyncStatus.status = 'completed';
    lastSyncStatus.results = results;
    
    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: results
    });
  } catch (error) {
    lastSyncStatus.status = 'failed';
    lastSyncStatus.results = { error: error.message };
    next(error);
  }
};

exports.getSyncStatus = async (req, res, next) => {
  try {
    const totalProducts = await VTUProduct.countDocuments();
    const activeProducts = await VTUProduct.countDocuments({ isActive: true });
    
    const productsByCategory = await VTUProduct.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        ...lastSyncStatus,
        totalProducts,
        activeProducts,
        productsByCategory
      }
    });
  } catch (error) {
    next(error);
  }
};
