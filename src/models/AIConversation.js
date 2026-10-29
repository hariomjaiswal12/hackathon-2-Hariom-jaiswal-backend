const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    text: { type: String, required: true },
    claim: String,
    confidence: {
      level: { type: String, default: 'high' },
      percentage: Number,
      label: String,
      detail: String,
    },
    evidenceRef: {
      mentions: Number,
      positive: Number,
      neutral: Number,
      negative: Number,
      sourcesCount: Number,
      reviewsCount: Number,
      checkedDaysAgo: Number,
    },
    sources: [String],
    sourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }],
    followUps: [String],
    caveats: String,
    provider: { type: String, default: 'gemini' },
    model: String,
    isFallback: { type: Boolean, default: false },
    fallbackReason: String,
    isDemoData: { type: Boolean, default: true },
  },
  { _id: false }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    companyContext: String,
    title: {
      type: String,
      required: true,
    },
    messages: [aiMessageSchema],
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

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = AIConversation;

