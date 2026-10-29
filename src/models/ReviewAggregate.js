const mongoose = require('mongoose');

const reviewAggregateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
      index: true,
    },
    companySlug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    sampleSourcesCount: {
      type: Number,
      default: 0,
    },
    daysSinceCheck: {
      type: Number,
      default: 12,
    },
    commonPositiveThemes: [
      {
        theme: String,
        percentage: Number,
        signal: { type: String, default: 'positive' },
        _id: false,
      },
    ],
    concernsWorthExploring: [
      {
        concern: String,
        percentage: Number,
        signal: { type: String, default: 'negative' },
        _id: false,
      },
    ],
    sentimentTrend: [
      {
        year: Number,
        positive: Number,
        neutral: Number,
        negative: Number,
        _id: false,
      },
    ],
    sourceAgreement: {
      summary: String,
      sources: [mongoose.Schema.Types.Mixed],
    },
    themesTable: [
      {
        theme: String,
        relatedMentions: Number,
        evidenceQuality: String,
        signal: String,
        nextStep: String,
        _id: false,
      },
    ],
    interpretation: {
      summary: String,
      limitations: String,
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

const ReviewAggregate = mongoose.model('ReviewAggregate', reviewAggregateSchema);

module.exports = ReviewAggregate;

