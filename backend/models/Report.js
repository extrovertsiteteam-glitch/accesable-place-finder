const mongoose = require('mongoose');

const issueTypes = [
  'Facility Missing',
  'Facility Broken / Inoperable',
  'Incorrect Address / Hours',
  'Misleading Accessibility Information',
  'Other'
];

const reportStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];

const reportSchema = new mongoose.Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'Place ID is required for an inaccuracy report'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reporterName: {
      type: String,
      trim: true,
      default: 'Anonymous Contributor'
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    issueType: {
      type: String,
      required: [true, 'Please select the issue type'],
      enum: {
        values: issueTypes,
        message: '{VALUE} is not a valid issue type'
      },
      index: true
    },
    facilityAffected: {
      type: String,
      enum: ['Wheelchair Access', 'Ramp', 'Washroom', 'Elevator', 'Accessible Parking', 'Hours/Contact', 'General Information', 'Other'],
      default: 'General Information'
    },
    description: {
      type: String,
      required: [true, 'Please describe the inaccurate or broken facility details'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [1500, 'Description cannot exceed 1500 characters']
    },
    status: {
      type: String,
      enum: {
        values: reportStatuses,
        message: '{VALUE} is not a valid report status'
      },
      default: 'pending',
      index: true
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = {
  Report,
  issueTypes,
  reportStatuses
};
