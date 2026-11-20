const express = require('express');
const router = express.Router();
const { deleteReview } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');

// Delete own review (or admin)
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;
