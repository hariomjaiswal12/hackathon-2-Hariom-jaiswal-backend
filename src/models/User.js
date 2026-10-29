const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false, // Don't return password by default
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    careerStage: {
      type: String,
      enum: ['Student', 'Fresher', '1-2 years', '3+ years'],
      default: 'Fresher',
    },
    targetRole: {
      type: String,
      default: 'Backend Developer',
      trim: true,
    },
    defaultLocation: {
      type: String,
      default: 'India',
      trim: true,
    },
    preferredWorkStyle: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Hybrid',
    },
    researchPreferences: {
      showSourceMetadata: { type: Boolean, default: true },
      showConfidence: { type: Boolean, default: true },
      useCareerDNAForRecommendations: { type: Boolean, default: true },
    },
    notificationPreferences: {
      evidenceUpdates: { type: Boolean, default: true },
      sourceConflictAlerts: { type: Boolean, default: true },
      emailDigest: { type: Boolean, default: false },
      digestFrequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], default: 'Weekly' },
    },
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now, expires: '30d' },
      },
    ],
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    isDemoUser: {
      type: Boolean,
      default: false,
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
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  }
);

// Password comparison helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== 'string' || !this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Password hash static helper
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Export User model
const User = mongoose.model('User', userSchema);

module.exports = User;
