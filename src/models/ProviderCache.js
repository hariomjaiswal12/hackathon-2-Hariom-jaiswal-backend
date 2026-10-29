const mongoose = require('mongoose');

const providerCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB TTL index: automatically deletes document when expiresAt <= now
    },
  },
  {
    timestamps: true,
  }
);

providerCacheSchema.index({ provider: 1, query: 1 });

const ProviderCache = mongoose.model('ProviderCache', providerCacheSchema);

module.exports = ProviderCache;

