const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
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
    categoryKey: {
      type: String,
      required: true,
      index: true,
    },
    claim: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['SUPPORTED', 'CONFLICTING', 'MISSING', 'STALE'],
      default: 'SUPPORTED',
    },
    reviewsAnalyzed: {
      type: Number,
      default: 0,
    },
    relevantMentions: {
      type: Number,
      default: 0,
    },
    sentimentBreakdown: {
      positive: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      negative: { type: Number, default: 0 },
    },
    sources: [
      {
        name: String,
        reviewCount: Number,
        date: String,
        verified: Boolean,
        statusText: String,
        _id: false,
      },
    ],
    sourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Source',
      },
    ],
    confidence: {
      level: {
        type: String,
        enum: ['high', 'medium', 'low', 'insufficient', 'conflict', 'stale', 'mixed'],
        default: 'high',
      },
      percentage: Number,
      label: String,
      detail: String,
    },
    limitations: [String],
    contextNote: String,
    userPreferenceNote: String,
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
        ret.id = `ev-${ret.companySlug}-${ret.categoryKey}`;
        delete ret.__v;
        return ret;
      },
    },
  }
);

evidenceSchema.index({ companySlug: 1, categoryKey: 1 });

const Evidence = mongoose.model('Evidence', evidenceSchema);

module.exports = Evidence;

