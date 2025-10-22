const mongoose = require('mongoose');
require('dotenv').config();
const OnboardingSlide = require('../models/OnboardingSlide');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/addis-payment';

const slides = [
  {
    title: 'Welcome to Addis',
    description: 'Your complete payment solution for all your needs',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
    backgroundColor: '#6366f1',
    textColor: '#FFFFFF',
    order: 0,
    isActive: true,
    metadata: {
      titleFontSize: 32,
      descriptionFontSize: 16,
      alignment: 'center'
    }
  },
  {
    title: 'Fast & Secure',
    description: 'Pay bills, buy airtime, data and more instantly',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    backgroundColor: '#10b981',
    textColor: '#FFFFFF',
    order: 1,
    isActive: true,
    metadata: {
      titleFontSize: 32,
      descriptionFontSize: 16,
      alignment: 'center'
    }
  },
  {
    title: 'Manage Your Money',
    description: 'Track transactions and manage your wallet easily',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    backgroundColor: '#f59e0b',
    textColor: '#FFFFFF',
    order: 2,
    isActive: true,
    metadata: {
      titleFontSize: 32,
      descriptionFontSize: 16,
      alignment: 'center'
    }
  },
  {
    title: 'Get Started Today',
    description: 'Join thousands of users enjoying seamless payments',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800',
    backgroundColor: '#8b5cf6',
    textColor: '#FFFFFF',
    order: 3,
    isActive: true,
    metadata: {
      titleFontSize: 32,
      descriptionFontSize: 16,
      alignment: 'center'
    }
  }
];

async function seedOnboarding() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await OnboardingSlide.deleteMany({});
    console.log('Cleared existing onboarding slides');

    await OnboardingSlide.insertMany(slides);
    console.log('✅ Successfully created 4 onboarding slides');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding onboarding slides:', error);
    process.exit(1);
  }
}

seedOnboarding();
