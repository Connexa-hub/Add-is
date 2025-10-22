const mongoose = require('mongoose');

const OnboardingSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'gif'],
    default: 'image',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    buttonText: String,
    buttonAction: String,
    titleFontSize: Number,
    descriptionFontSize: Number,
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

OnboardingSlideSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('OnboardingSlide', OnboardingSlideSchema);
