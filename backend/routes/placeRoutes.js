const express = require('express');
const router = express.Router();
const {
  getPlaces,
  getPopularPlaces,
  getRecentPlaces,
  getCategories,
  getCities,
  getPlaceById
} = require('../controllers/placeController');
const { getPlaceReviews, createReview } = require('../controllers/reviewController');
const { createReport } = require('../controllers/reportController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { reviewValidation, reportValidation } = require('../middleware/validationMiddleware');
const { reportLimiter } = require('../middleware/rateLimitMiddleware');

// Public listing & discovery routes
router.get('/', getPlaces);
router.get('/popular', getPopularPlaces);
router.get('/recent', getRecentPlaces);
router.get('/categories', getCategories);
router.get('/cities', getCities);
router.get('/:id', getPlaceById);

// Place reviews
router.get('/:id/reviews', getPlaceReviews);
router.post('/:id/reviews', verifyToken, reviewValidation, createReview);

// Place accessibility inaccuracy report
router.post('/:id/reports', optionalAuth, reportLimiter, reportValidation, createReport);

module.exports = router;
