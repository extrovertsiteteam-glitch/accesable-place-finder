const express = require('express');
const router = express.Router();
const { updateProfile, getMyReviews, getMyReports } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// All user routes are protected
router.use(verifyToken);

router.put('/profile', updateProfile);
router.get('/my-reviews', getMyReviews);
router.get('/my-reports', getMyReports);

module.exports = router;
