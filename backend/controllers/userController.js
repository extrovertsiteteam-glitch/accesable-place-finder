const User = require('../models/User');
const Review = require('../models/Review');
const { Report } = require('../models/Report');

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, accessibilityPreferences } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name.trim();
    if (Array.isArray(accessibilityPreferences)) {
      user.accessibilityPreferences = accessibilityPreferences;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessibilityPreferences: user.accessibilityPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews submitted by the current user
 * @route   GET /api/users/my-reviews
 * @access  Private
 */
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate({
        path: 'place',
        select: 'name category city address photos averageRating reviewCount'
      })
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
 * @desc    Get all reports submitted by the current user
 * @route   GET /api/users/my-reports
 * @access  Private
 */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({
      $or: [{ user: req.user._id }, { reporterEmail: req.user.email.toLowerCase() }]
    })
      .populate({
        path: 'place',
        select: 'name category city address photos'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  getMyReviews,
  getMyReports
};
