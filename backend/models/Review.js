const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'Place ID is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a star rating between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5'
      }
    },
    comment: {
      type: String,
      required: [true, 'Please write your review comment'],
      trim: true,
      minlength: [5, 'Review comment must be at least 5 characters long'],
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    facilityFeedback: {
      wheelchairAccessible: { type: Boolean, default: null },
      rampAvailable: { type: Boolean, default: null },
      accessibleWashroom: { type: Boolean, default: null },
      elevatorAvailable: { type: Boolean, default: null },
      accessibleParking: { type: Boolean, default: null }
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate review by same user on same place
reviewSchema.index({ place: 1, user: 1 }, { unique: true });

// Static method to recalculate place average rating and review count
reviewSchema.statics.recalculatePlaceRating = async function (placeId) {
  const stats = await this.aggregate([
    {
      $match: { place: new mongoose.Types.ObjectId(placeId) }
    },
    {
      $group: {
        _id: '$place',
        reviewCount: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    const Place = mongoose.model('Place');
    if (stats.length > 0) {
      await Place.findByIdAndUpdate(placeId, {
        reviewCount: stats[0].reviewCount,
        averageRating: Math.round(stats[0].averageRating * 10) / 10
      });
    } else {
      // No reviews left
      await Place.findByIdAndUpdate(placeId, {
        reviewCount: 0,
        averageRating: 0
      });
    }
  } catch (err) {
    console.error('Error recalculating place ratings:', err);
  }
};

// Post-save hook to update average rating
reviewSchema.post('save', async function () {
  await this.constructor.recalculatePlaceRating(this.place);
});

// Post-delete hooks
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.recalculatePlaceRating(doc.place);
  }
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.recalculatePlaceRating(this.place);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
