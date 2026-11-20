const Review = require('../models/Review');
const { Place } = require('../models/Place');

/**
 * @desc    Get all reviews for a place
 * @route   GET /api/places/:id/reviews
 * @access  Public
 */
const getPlaceReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    const reviews = await Review.find({ place: id })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit or update a review for a place
 * @route   POST /api/places/:id/reviews
 * @access  Private
 */
const createReview = async (req, res, next) => {
  try {
    const { id: placeId } = req.params;
    const { rating, comment, facilityFeedback } = req.body;
    const userId = req.user._id;

    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Check if user already reviewed this place
    let review = await Review.findOne({ place: placeId, user: userId });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment.trim();
      if (facilityFeedback) {
        review.facilityFeedback = facilityFeedback;
      }
      await review.save();

      await review.populate('user', 'name role');

      return res.status(200).json({
        success: true,
        message: 'Your review has been updated successfully!',
        review
      });
    }

    // Create new review
    review = await Review.create({
      place: placeId,
      user: userId,
      rating: Number(rating),
      comment: comment.trim(),
      facilityFeedback: facilityFeedback || {}
    });

    await review.populate('user', 'name role');

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted.',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review (author or admin)
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership or admin status
    const isAuthor = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review'
      });
    }

    const placeId = review.place;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate place rating
    await Review.recalculatePlaceRating(placeId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlaceReviews,
  createReview,
  deleteReview
};
