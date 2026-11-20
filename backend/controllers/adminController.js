const { Place } = require('../models/Place');
const User = require('../models/User');
const Review = require('../models/Review');
const { Report } = require('../models/Report');

/**
 * @desc    Get dashboard metrics & statistical summary
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
const getStats = async (req, res, next) => {
  try {
    const [
      totalPlaces,
      totalUsers,
      totalReviews,
      pendingReports,
      resolvedReports,
      categoryStats
    ] = await Promise.all([
      Place.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'resolved' }),
      Place.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Fetch 5 most recent reports
    const recentReports = await Report.find()
      .populate('place', 'name city category')
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch 5 most recent reviews
    const recentReviews = await Review.find()
      .populate('place', 'name city')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalPlaces,
        totalUsers,
        totalReviews,
        pendingReports,
        resolvedReports,
        categoryStats
      },
      recentReports,
      recentReviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all places with admin filtering and pagination
 * @route   GET /api/admin/places
 * @access  Private (Admin Only)
 */
const getAdminPlaces = async (req, res, next) => {
  try {
    const { q, category, city, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: regex }, { city: regex }, { address: regex }];
    }
    if (category && category.trim()) {
      filter.category = category.trim();
    }
    if (city && city.trim()) {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Place.countDocuments(filter);
    const places = await Place.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      places,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new place
 * @route   POST /api/admin/places
 * @access  Private (Admin Only)
 */
const createPlace = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      address,
      city,
      contactPhone,
      contactEmail,
      website,
      openingHours,
      wheelchairAccessible,
      rampAvailable,
      accessibleWashroom,
      elevatorAvailable,
      accessibleParking,
      additionalAccessibility,
      photoUrl
    } = req.body;

    const photos = [];
    if (req.file) {
      photos.push(`/uploads/${req.file.filename}`);
    } else if (photoUrl && photoUrl.trim()) {
      photos.push(photoUrl.trim());
    }

    const place = await Place.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      address: address.trim(),
      city: city.trim(),
      contactPhone: contactPhone ? contactPhone.trim() : '',
      contactEmail: contactEmail ? contactEmail.trim() : '',
      website: website ? website.trim() : '',
      openingHours: openingHours ? openingHours.trim() : 'Contact for opening hours',
      wheelchairAccessible: wheelchairAccessible === true || wheelchairAccessible === 'true',
      rampAvailable: rampAvailable === true || rampAvailable === 'true',
      accessibleWashroom: accessibleWashroom === true || accessibleWashroom === 'true',
      elevatorAvailable: elevatorAvailable === true || elevatorAvailable === 'true',
      accessibleParking: accessibleParking === true || accessibleParking === 'true',
      additionalAccessibility: additionalAccessibility ? additionalAccessibility.trim() : 'Standard accessibility compliance',
      photos,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Place created successfully!',
      place
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing place
 * @route   PUT /api/admin/places/:id
 * @access  Private (Admin Only)
 */
const updatePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    const fieldsToUpdate = [
      'name',
      'description',
      'category',
      'address',
      'city',
      'contactPhone',
      'contactEmail',
      'website',
      'openingHours',
      'additionalAccessibility'
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        place[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    const booleanFields = [
      'wheelchairAccessible',
      'rampAvailable',
      'accessibleWashroom',
      'elevatorAvailable',
      'accessibleParking'
    ];

    booleanFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        place[field] = req.body[field] === true || req.body[field] === 'true';
      }
    });

    // Handle photo updates
    if (req.file) {
      place.photos = [`/uploads/${req.file.filename}`];
    } else if (req.body.photoUrl && req.body.photoUrl.trim()) {
      place.photos = [req.body.photoUrl.trim()];
    }

    await place.save();

    res.status(200).json({
      success: true,
      message: 'Place updated successfully!',
      place
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete place and associated reviews and reports
 * @route   DELETE /api/admin/places/:id
 * @access  Private (Admin Only)
 */
const deletePlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Cascade delete reviews and reports
    await Promise.all([
      Review.deleteMany({ place: place._id }),
      Report.deleteMany({ place: place._id }),
      Place.findByIdAndDelete(place._id)
    ]);

    res.status(200).json({
      success: true,
      message: `Place "${place.name}" and all related reviews and reports have been permanently deleted.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews across places for moderation
 * @route   GET /api/admin/reviews
 * @access  Private (Admin Only)
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate('place', 'name city category')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin delete a review
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private (Admin Only)
 */
const adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const placeId = review.place;
    await Review.findByIdAndDelete(req.params.id);
    await Review.recalculatePlaceRating(placeId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully by administrator'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all accessibility inaccuracy reports
 * @route   GET /api/admin/reports
 * @access  Private (Admin Only)
 */
const getAllReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status.trim() && status !== 'all') {
      filter.status = status.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate('place', 'name city category address')
      .populate('user', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update status of an accessibility report (resolved / dismissed)
 * @route   PATCH /api/admin/reports/:id
 * @access  Private (Admin Only)
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes.trim();
    }

    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();
    await report.populate('place', 'name city category');
    await report.populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Report marked as ${status} successfully.`,
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAdminPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  getAllReviews,
  adminDeleteReview,
  getAllReports,
  updateReportStatus
};
