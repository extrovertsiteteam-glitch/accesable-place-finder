const express = require('express');
const router = express.Router();
const {
  getStats,
  getAdminPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  getAllReviews,
  adminDeleteReview,
  getAllReports,
  updateReportStatus
} = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { placeValidation, reportStatusValidation } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all admin routes: must be authenticated and have role: 'admin'
router.use(verifyToken, requireAdmin);

// Dashboard statistics
router.get('/stats', getStats);

// Places management
router.get('/places', getAdminPlaces);
router.post('/places', upload.single('photo'), placeValidation, createPlace);
router.put('/places/:id', upload.single('photo'), placeValidation, updatePlace);
router.delete('/places/:id', deletePlace);

// Reviews management
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', adminDeleteReview);

// Reports management
router.get('/reports', getAllReports);
router.patch('/reports/:id', reportStatusValidation, updateReportStatus);

module.exports = router;
