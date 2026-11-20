const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { reportValidation } = require('../middleware/validationMiddleware');
const { reportLimiter } = require('../middleware/rateLimitMiddleware');

// Direct report submission endpoint: POST /api/reports/:id
router.post('/:id', optionalAuth, reportLimiter, reportValidation, createReport);

module.exports = router;
