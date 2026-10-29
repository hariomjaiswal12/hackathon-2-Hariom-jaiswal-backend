const mongoose = require('mongoose');

const jobSalarySchema = new mongoose.Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    period: { type: String, enum: ['YEAR', 'MONTH', 'HOUR', 'ONE_TIME', null], default: 'YEAR' },
    text: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
      default: null,
    },
    companySlug: {
      type: String,
      required: [true, 'Company slug is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    externalJobId: {
      type: String,
      required: [true, 'External job ID is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    responsibilities: [{
      type: String,
      trim: true,
    }],
    skills: [{
      type: String,
      trim: true,
    }],
    experienceRange: {
      type: String,
      trim: true,
      default: null,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'],
      default: 'Full-time',
      index: true,
    },
    workArrangement: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site', 'Unspecified'],
      default: 'Unspecified',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
      index: true,
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering',
      index: true,
    },
    salary: {
      type: jobSalarySchema,
      default: () => ({}),
    },
    postedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    applyUrl: {
      type: String,
      required: [true, 'Apply URL is required'],
      trim: true,
    },
    originalUrl: {
      type: String,
      trim: true,
      default: null,
    },
    sourceProvider: {
      type: String,
      enum: ['GREENHOUSE', 'LEVER', 'COMPANY_PORTAL', 'WORKDAY', 'MANUAL_VERIFIED'],
      default: 'GREENHOUSE',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to guarantee uniqueness of job listings per company and external ID
jobSchema.index({ companySlug: 1, externalJobId: 1 }, { unique: true });

// Query index for efficient search, filtering, and sorting
jobSchema.index({ companySlug: 1, status: 1, postedAt: -1 });
jobSchema.index({ companySlug: 1, workArrangement: 1, employmentType: 1 });

// Full text search index
jobSchema.index({
  title: 'text',
  department: 'text',
  skills: 'text',
  location: 'text',
  description: 'text',
});

module.exports = mongoose.model('Job', jobSchema);

