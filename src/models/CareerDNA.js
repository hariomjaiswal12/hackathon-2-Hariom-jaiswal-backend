const mongoose = require('mongoose');

const careerDnaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetRole: {
      type: String,
      default: 'Backend Developer',
      trim: true,
    },
    experience: {
      type: String,
      enum: ['Student', 'Fresher', '1-2 years', '3+ years'],
      default: 'Fresher',
    },
    workStyle: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Hybrid',
    },
    preferredLocation: {
      type: String,
      default: 'Bangalore, India',
      trim: true,
    },
    priorities: {
      learning: { type: Number, min: 0, max: 100, default: 95 },
      growth: { type: Number, min: 0, max: 100, default: 90 },
      stability: { type: Number, min: 0, max: 100, default: 85 },
      culture: { type: Number, min: 0, max: 100, default: 80 },
      wlb: { type: Number, min: 0, max: 100, default: 75 },
      salary: { type: Number, min: 0, max: 100, default: 70 },
      technology: { type: Number, min: 0, max: 100, default: 90 },
      location: { type: Number, min: 0, max: 100, default: 60 },
    },
    skills: {
      type: [String],
      default: ['JavaScript', 'Node.js', 'Python', 'SQL'],
    },
    isComplete: {
      type: Boolean,
      default: true,
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

const CareerDNA = mongoose.model('CareerDNA', careerDnaSchema);

module.exports = CareerDNA;

