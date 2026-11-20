const { Place, placeCategories } = require('../models/Place');
const Review = require('../models/Review');

/**
 * @desc    Search and filter places with pagination
 * @route   GET /api/places
 * @access  Public
 */
const getPlaces = async (req, res, next) => {
  try {
    const {
      q,
      city,
      category,
      wheelchair,
      ramp,
      washroom,
      elevator,
      parking,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const queryFilter = {};

    // Search query: match name, description, city, address or category
    if (q && q.trim()) {
      const searchTerm = q.trim();
      const regex = new RegExp(searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      queryFilter.$or = [
        { name: regex },
        { description: regex },
        { city: regex },
        { address: regex },
        { category: regex }
      ];
    }

    // Filter by City
    if (city && city.trim()) {
      queryFilter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    // Filter by Category
    if (category && category.trim()) {
      queryFilter.category = category.trim();
    }

    // Filter by Accessibility Facilities
    if (wheelchair === 'true' || wheelchair === true) {
      queryFilter.wheelchairAccessible = true;
    }
    if (ramp === 'true' || ramp === true) {
      queryFilter.rampAvailable = true;
    }
    if (washroom === 'true' || washroom === true) {
      queryFilter.accessibleWashroom = true;
    }
    if (elevator === 'true' || elevator === true) {
      queryFilter.elevatorAvailable = true;
    }
    if (parking === 'true' || parking === true) {
      queryFilter.accessibleParking = true;
    }

    // Sorting options
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'rating') {
      sortOptions = { averageRating: -1, reviewCount: -1 };
    } else if (sort === 'reviews') {
      sortOptions = { reviewCount: -1, averageRating: -1 };
    } else if (sort === 'name') {
      sortOptions = { name: 1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const total = await Place.countDocuments(queryFilter);
    const places = await Place.find(queryFilter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      places,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
        count: places.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top rated and most popular places
 * @route   GET /api/places/popular
 * @access  Public
 */
const getPopularPlaces = async (req, res, next) => {
  try {
    const places = await Place.find({ averageRating: { $gte: 3.5 } })
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(6);

    // Fallback if not enough high-rated places
    let finalPlaces = places;
    if (finalPlaces.length < 3) {
      finalPlaces = await Place.find().sort({ averageRating: -1, createdAt: -1 }).limit(6);
    }

    res.status(200).json({
      success: true,
      count: finalPlaces.length,
      places: finalPlaces
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recently added places
 * @route   GET /api/places/recent
 * @access  Public
 */
const getRecentPlaces = async (req, res, next) => {
  try {
    const places = await Place.find()
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      count: places.length,
      places
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all categories and count of places in each
 * @route   GET /api/places/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const counts = await Place.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const categoryList = placeCategories.map((cat) => ({
      name: cat,
      count: countMap[cat] || 0
    }));

    res.status(200).json({
      success: true,
      categories: categoryList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of distinct cities
 * @route   GET /api/places/cities
 * @access  Public
 */
const getCities = async (req, res, next) => {
  try {
    const cities = await Place.distinct('city');
    cities.sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      cities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single place by ID with recent reviews
 * @route   GET /api/places/:id
 * @access  Public
 */
const getPlaceById = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id).populate('createdBy', 'name email');

    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    // Fetch latest reviews for this place
    const reviews = await Review.find({ place: place._id })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      place,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlaces,
  getPopularPlaces,
  getRecentPlaces,
  getCategories,
  getCities,
  getPlaceById
};
