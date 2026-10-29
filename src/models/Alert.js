const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    companySlug: String,
    companyName: String,
    type: {
      type: String,
      enum: ['score_update', 'source_freshness', 'fit_change', 'evidence_alert'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: 'Oct 28, 2026',
    },
    previousScore: Number,
    newScore: Number,
    description: String,
    isNew: {
      type: Boolean,
      default: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionText: String,
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
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

alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
