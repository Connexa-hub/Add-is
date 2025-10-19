const Banner = require('../models/Banner');

const getBanners = async (req, res) => {
  try {
    const { section } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      activeFrom: { $lte: now }
    };

    if (section) {
      query.targetSection = section;
    }

    query.$or = [
      { activeTo: { $exists: false } },
      { activeTo: null },
      { activeTo: { $gte: now } }
    ];

    const banners = await Banner.find(query)
      .sort({ weight: -1, createdAt: -1 })
      .select('-clickCount -impressionCount');

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, description, mediaType, mediaUrl, targetUrl, targetSection, weight, activeFrom, activeTo } = req.body;

    if (!title || !mediaUrl || !targetSection || targetSection.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, mediaUrl, and at least one targetSection are required'
      });
    }

    const banner = await Banner.create({
      title,
      description,
      mediaType: mediaType || 'image',
      mediaUrl,
      targetUrl,
      targetSection,
      weight: weight || 1,
      activeFrom: activeFrom || new Date(),
      activeTo: activeTo || null,
      isActive: true,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const updates = req.body;

    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const banner = await Banner.findByIdAndDelete(bannerId);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
};

const listAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const banners = await Banner.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Banner.countDocuments();

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('List banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list banners',
      error: error.message
    });
  }
};

const trackImpression = async (req, res) => {
  try {
    const { bannerId } = req.params;

    await Banner.findByIdAndUpdate(bannerId, {
      $inc: { impressionCount: 1 }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const trackClick = async (req, res) => {
  try {
    const { bannerId } = req.params;

    await Banner.findByIdAndUpdate(bannerId, {
      $inc: { clickCount: 1 }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  listAllBanners,
  trackImpression,
  trackClick
};
