const mongoose = require('mongoose');

const categoryScoreSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, default: null }, // Null if missing!
    previousScore: { type: Number, min: 0, max: 100, default: null },
    trend: { type: String, enum: ['positive', 'neutral', 'negative', 'mixed'], default: 'positive' },
    trendText: String,
    summary: String,
    evidenceCount: { type: Number, default: 0 },
    evidenceStatus: {
      type: String,
      enum: ['SUPPORTED', 'CONFLICTING', 'MISSING', 'STALE'],
      default: 'SUPPORTED',
    },
    confidence: {
      level: { type: String, enum: ['high', 'medium', 'low', 'insufficient', 'conflict', 'stale', 'mixed'], default: 'high' },
      percentage: Number,
      label: String,
      detail: String,
    },
    weight: { type: Number, default: 0.15 },
    supportingMentions: { type: Number, default: 0 },
    positiveMentions: { type: Number, default: 0 },
    neutralMentions: { type: Number, default: 0 },
    negativeMentions: { type: Number, default: 0 },
  },
  { _id: false }
);

const companyIntelligenceSchema = new mongoose.Schema(
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
      index: true,
    },
    categories: {
      learning: categoryScoreSchema,
      growth: categoryScoreSchema,
      stability: categoryScoreSchema,
      culture: categoryScoreSchema,
      wlb: categoryScoreSchema,
      salary: categoryScoreSchema,
      management: categoryScoreSchema,
      satisfaction: categoryScoreSchema,
    },
    positiveSignals: [String],
    concernSignals: [String],
    aiSummary: {
      highlight: String,
      quote: String,
      freshness: String,
      sourcesCount: Number,
      reviewCount: Number,
      confidence: {
        level: { type: String, default: 'high' },
        percentage: Number,
        label: String,
      },
    },
    praises: [
      {
        title: String,
        percentage: Number,
        count: Number,
        _id: false,
      },
    ],
    mixed: [
      {
        title: String,
        percentage: Number,
        count: Number,
        _id: false,
      },
    ],
    risks: [
      {
        level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
        category: String,
        score: Number,
        description: String,
        _id: false,
      },
    ],
    concernsToInvestigate: [
      {
        id: String,
        title: String,
        description: String,
        _id: false,
      },
    ],
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

const CompanyIntelligence = mongoose.model('CompanyIntelligence', companyIntelligenceSchema);

module.exports = CompanyIntelligence;

