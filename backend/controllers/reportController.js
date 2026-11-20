const { Report } = require('../models/Report');
const { Place } = require('../models/Place');

/**
 * @desc    Submit an accessibility inaccuracy report for a place
 * @route   POST /api/places/:id/reports
 * @access  Public (Guest or Authenticated)
 */
const createReport = async (req, res, next) => {
  try {
    const { id: placeId } = req.params;
    const { issueType, facilityAffected, description, reporterName, reporterEmail } = req.body;

    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({
        success: false,
        message: 'Place not found'
      });
    }

    const reportData = {
      place: placeId,
      issueType,
      facilityAffected: facilityAffected || 'General Information',
      description: description.trim(),
      reporterName: req.user ? req.user.name : reporterName || 'Anonymous Contributor',
      reporterEmail: req.user ? req.user.email : reporterEmail || '',
      user: req.user ? req.user._id : null,
      status: 'pending'
    };

    const report = await Report.create(reportData);

    res.status(201).json({
      success: true,
      message: 'Inaccuracy report submitted successfully. Our administration team will review and verify this information.',
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport
};
