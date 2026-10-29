const mongoose = require('mongoose');

const companySubmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 150,
    },
    legalName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    jurisdiction: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    city: {
      type: String,
      trim: true,
    },
    headquarters: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      lowercase: true,
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    foundedYear: {
      type: Number,
    },
    officialEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    evidenceNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      name: String,
      ipAddress: String,
    },
    reviewedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      reviewedAt: Date,
      notes: String,
    },
    approvedCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
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

companySubmissionSchema.index({ name: 1, registrationNumber: 1 });
companySubmissionSchema.index({ status: 1, createdAt: -1 });

const CompanySubmission = mongoose.model('CompanySubmission', companySubmissionSchema);

module.exports = CompanySubmission;

