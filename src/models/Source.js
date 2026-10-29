const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    companySlug: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Official Company', 'Employee Review', 'Public Dataset', 'AI interpretation', 'User Preference'],
      required: true,
      index: true,
    },
    sampleSize: {
      type: String,
      default: '',
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    date: {
      type: String,
      default: 'Oct 2026',
    },
    publishedAt: Date,
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    freshness: {
      type: String,
      default: 'Recent',
    },
    freshnessStatus: {
      type: String,
      enum: ['Recent', 'Stale', 'Historical'],
      default: 'Recent',
    },
    status: {
      type: String,
      enum: ['Verified', 'Mixed', 'Needs refresh', 'User supplied', 'High confidence', 'Stale', 'Unverified'],
      default: 'Verified',
    },
    statusType: {
      type: String,
      enum: ['verified', 'mixed', 'warning', 'info', 'insufficient'],
      default: 'verified',
    },
    description: {
      type: String,
      trim: true,
    },
    agreement: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availabilityNotice: {
      type: String,
      default: null,
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

sourceSchema.index({ companyId: 1, type: 1, checkedAt: -1 });

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;

