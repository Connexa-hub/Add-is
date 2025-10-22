const OnboardingSlide = require('../models/OnboardingSlide');

const getOnboardingSlides = async (req, res) => {
  try {
    const slides = await OnboardingSlide.find({ isActive: true })
      .sort({ order: 1 })
      .select('-createdBy -__v');

    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Get onboarding slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding slides',
      error: error.message
    });
  }
};

const getAllOnboardingSlides = async (req, res) => {
  try {
    const slides = await OnboardingSlide.find()
      .sort({ order: 1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Get all onboarding slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding slides',
      error: error.message
    });
  }
};

const createOnboardingSlide = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      mediaType, 
      mediaUrl, 
      backgroundColor, 
      textColor, 
      order, 
      metadata 
    } = req.body;

    if (!title || !description || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and mediaUrl are required'
      });
    }

    const slide = await OnboardingSlide.create({
      title,
      description,
      mediaType: mediaType || 'image',
      mediaUrl,
      backgroundColor: backgroundColor || '#FFFFFF',
      textColor: textColor || '#000000',
      order: order || 0,
      metadata: metadata || {},
      isActive: true,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Onboarding slide created successfully',
      data: slide
    });
  } catch (error) {
    console.error('Create onboarding slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create onboarding slide',
      error: error.message
    });
  }
};

const updateOnboardingSlide = async (req, res) => {
  try {
    const { slideId } = req.params;
    const updates = req.body;

    const slide = await OnboardingSlide.findByIdAndUpdate(
      slideId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding slide not found'
      });
    }

    res.json({
      success: true,
      message: 'Onboarding slide updated successfully',
      data: slide
    });
  } catch (error) {
    console.error('Update onboarding slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding slide',
      error: error.message
    });
  }
};

const deleteOnboardingSlide = async (req, res) => {
  try {
    const { slideId } = req.params;

    const slide = await OnboardingSlide.findByIdAndDelete(slideId);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding slide not found'
      });
    }

    res.json({
      success: true,
      message: 'Onboarding slide deleted successfully'
    });
  } catch (error) {
    console.error('Delete onboarding slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete onboarding slide',
      error: error.message
    });
  }
};

const reorderOnboardingSlides = async (req, res) => {
  try {
    const { slides } = req.body;

    if (!Array.isArray(slides)) {
      return res.status(400).json({
        success: false,
        message: 'Slides must be an array'
      });
    }

    const updatePromises = slides.map(({ id, order }) =>
      OnboardingSlide.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Onboarding slides reordered successfully'
    });
  } catch (error) {
    console.error('Reorder onboarding slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder onboarding slides',
      error: error.message
    });
  }
};

module.exports = {
  getOnboardingSlides,
  getAllOnboardingSlides,
  createOnboardingSlide,
  updateOnboardingSlide,
  deleteOnboardingSlide,
  reorderOnboardingSlides
};
