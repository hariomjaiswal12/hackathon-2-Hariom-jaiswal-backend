const mongoose = require('mongoose');

const researchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activity: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Company', 'Comparison', 'AI question', 'Evidence'],
      required: true,
      index: true,
    },
    context: {
      type: String,
      default: '',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    companySlug: String,
    comparisonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComparisonScenario',
    },
    link: String,
    time: String,
    dateGroup: {
      type: String,
      default: 'TODAY / OCT 28, 2026',
    },
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

researchHistorySchema.index({ userId: 1, createdAt: -1 });

const ResearchHistory = mongoose.model('ResearchHistory', researchHistorySchema);

module.exports = ResearchHistory;

