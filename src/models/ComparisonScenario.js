const mongoose = require('mongoose');

const comparisonScenarioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    companies: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length >= 1;
        },
        message: 'A comparison scenario must contain at least 1 company.',
      },
    },
    companyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
      },
    ],
    scenarioType: {
      type: String,
      enum: ['baseline', 'what-if', 'battle', 'custom'],
      default: 'custom',
    },
    isBaseline: {
      type: Boolean,
      default: false,
    },
    priorities: {
      learning: { type: Number, default: 95 },
      growth: { type: Number, default: 90 },
      stability: { type: Number, default: 85 },
      culture: { type: Number, default: 80 },
      wlb: { type: Number, default: 75 },
      salary: { type: Number, default: 70 },
      technology: { type: Number, default: 90 },
      location: { type: Number, default: 60 },
    },
    rankings: [
      {
        companyId: String,
        companyName: String,
        score: Number,
        rank: Number,
        tagline: String,
        _id: false,
      },
    ],
    comparisonData: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

comparisonScenarioSchema.index({ userId: 1, createdAt: -1 });

const ComparisonScenario = mongoose.model('ComparisonScenario', comparisonScenarioSchema);

module.exports = ComparisonScenario;

