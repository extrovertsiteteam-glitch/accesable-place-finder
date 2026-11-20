const mongoose = require('mongoose');

const placeCategories = [
  'Healthcare',
  'Restaurant & Cafe',
  'Education & Library',
  'Park & Recreation',
  'Shopping & Mall',
  'Transit & Station',
  'Museum & Culture',
  'Government & Public',
  'Other'
];

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the place name'],
      trim: true,
      maxlength: [150, 'Place name cannot exceed 150 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the place'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Please select a valid place category'],
      enum: {
        values: placeCategories,
        message: '{VALUE} is not a valid category'
      },
      index: true
    },
    address: {
      type: String,
      required: [true, 'Please provide the full physical address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide the city'],
      trim: true,
      index: true
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    openingHours: {
      type: String,
      trim: true,
      default: 'Contact location for opening hours'
    },
    // Core Accessibility Facilities
    wheelchairAccessible: {
      type: Boolean,
      default: false,
      index: true
    },
    rampAvailable: {
      type: Boolean,
      default: false,
      index: true
    },
    accessibleWashroom: {
      type: Boolean,
      default: false,
      index: true
    },
    elevatorAvailable: {
      type: Boolean,
      default: false,
      index: true
    },
    accessibleParking: {
      type: Boolean,
      default: false,
      index: true
    },
    additionalAccessibility: {
      type: String,
      trim: true,
      default: 'Standard accessibility compliance'
    },
    // Media & Visuals
    photos: {
      type: [String],
      default: []
    },
    // Ratings & Reviews Aggregates
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10 // Round to 1 decimal place
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for powerful full-text search across name, description, city, address
placeSchema.index(
  {
    name: 'text',
    description: 'text',
    city: 'text',
    address: 'text',
    category: 'text'
  },
  {
    weights: {
      name: 10,
      city: 5,
      category: 4,
      address: 3,
      description: 1
    },
    name: 'PlaceTextIndex'
  }
);

// Compound index for category and city filtering
placeSchema.index({ city: 1, category: 1 });

const Place = mongoose.model('Place', placeSchema);

module.exports = {
  Place,
  placeCategories
};
