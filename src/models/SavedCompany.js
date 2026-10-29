const mongoose = require('mongoose');

const savedCompanySchema = new mongoose.Schema(
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
      required: true,
    },
    companySlug: {
      type: String,
      required: true,
      index: true,
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

// Compound index to prevent duplicate saves
savedCompanySchema.index({ userId: 1, companyId: 1 }, { unique: true });
savedCompanySchema.index({ userId: 1, companySlug: 1 }, { unique: true });

const SavedCompany = mongoose.model('SavedCompany', savedCompanySchema);

module.exports = SavedCompany;

