const mongoose = require('mongoose');

const openPositionSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    department: { type: String, trim: true },
    location: { type: String, trim: true },
    type: { type: String, trim: true },
    experience: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    sourceUrl: { type: String, trim: true },
    postedDate: { type: String, trim: true },
  },
  { _id: false }
);

const caseStudySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    client: { type: String, trim: true },
    outcome: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    year: Number,
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    date: { type: String, trim: true },
    title: { type: String, trim: true },
    summary: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const leadershipSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    legalDesignation: { type: String, trim: true },
    category: {
      type: String,
      enum: ['LEGAL_DIRECTOR', 'BUSINESS_LEADERSHIP', 'OPERATIONAL_LEAD', 'OTHER'],
      default: 'BUSINESS_LEADERSHIP',
    },
    din: { type: String, trim: true },
    appointmentDate: { type: String, trim: true },
    status: { type: String, trim: true, default: 'Active' },
    bio: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    source: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationBadge: { type: String, trim: true },
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    platform: { type: String, trim: true },
    rating: Number,
    maxRating: { type: Number, default: 5 },
    reviewCount: Number,
    sentiment: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const competitorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    domain: { type: String, trim: true },
    location: { type: String, trim: true },
    marketPosition: { type: String, trim: true },
    comparisonNote: { type: String, trim: true },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 150,
    },
    normalizedName: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    slug: {
      type: String,
      required: [true, 'Company slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    logoText: {
      type: String,
      default: '',
    },
    logoBg: {
      type: String,
      default: '#1E293B',
    },
    logoColor: {
      type: String,
      default: '#FFFFFF',
    },
    industry: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    headquarters: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    locations: [String],
    website: {
      type: String,
      trim: true,
    },
    foundedYear: Number,
    companySize: String,
    registrationNumber: {
      type: String,
      trim: true,
      index: true,
    },
    jurisdiction: {
      type: String,
      trim: true,
    },
    legalStatus: {
      type: String,
      trim: true,
      default: 'Active',
    },
    isStartup: {
      type: Boolean,
      default: false,
    },
    funding: {
      totalFunding: String,
      stage: String,
      currency: String,
      lastRoundDate: Date,
    },
    employeeCount: {
      type: Number,
      default: null,
    },
    legalName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    legalIncorporationDate: {
      type: String,
      trim: true,
    },
    registeredAddress: {
      type: String,
      trim: true,
    },
    operatingAddress: {
      type: String,
      trim: true,
    },
    addressConflicts: {
      type: String,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
      default: 'Private Limited Company',
    },
    parentCompany: {
      type: String,
      trim: true,
    },
    subsidiaries: [String],
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
      clutch: String,
      glassdoor: String,
    },
    businessModel: {
      type: String,
      trim: true,
    },
    targetMarkets: [String],
    operatingLocations: [String],
    services: [String],
    techStack: [String],
    partnerships: [String],
    clients: [String],
    caseStudies: [caseStudySchema],
    milestones: [milestoneSchema],
    announcements: [announcementSchema],
    expansionPlans: {
      type: String,
      trim: true,
    },
    financials: {
      isPublic: { type: Boolean, default: false },
      statusDescription: String,
      authorizedCapital: String,
      paidUpCapital: String,
      currency: String,
      revenue: String,
      revenuePeriod: String,
      profitLoss: String,
      fundingTotal: String,
      fundingStage: String,
      investors: [String],
      valuation: String,
      stockExchange: String,
      ticker: String,
      source: String,
      filingDate: String,
    },
    workforce: {
      employeeCount: Number,
      employeeCountRange: String,
      reportingDate: String,
      careersUrl: String,
      openPositions: [openPositionSchema],
      internshipOpportunities: String,
      workplacePolicies: {
        workModel: String,
        coreHours: String,
        perks: [String],
        leavePolicy: String,
        mentorshipProgram: String,
      },
    },
    leadership: [leadershipSchema],
    reputation: {
      ratings: [ratingSchema],
      certifications: [String],
      awards: [String],
    },
    competitors: [competitorSchema],
    description: {
      type: String,
      trim: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    overallScoreMax: {
      type: Number,
      default: 100,
    },
    confidence: {
      level: {
        type: String,
        enum: ['high', 'medium', 'low', 'insufficient', 'conflict', 'stale', 'mixed'],
        default: 'insufficient',
      },
      percentage: Number,
      label: String,
      detail: String,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    sampleSourcesCount: {
      type: Number,
      default: 0,
    },
    sampleSourcesSummary: {
      type: String,
      default: '',
    },
    isDemoData: {
      type: Boolean,
      default: false,
    },
    dataSources: [
      {
        provider: { type: String, required: true },
        sourceUrl: String,
        isAvailable: { type: Boolean, default: true },
        availabilityNotice: String,
        retrievedAt: { type: Date, default: Date.now },
        confidence: String,
        fieldsProvided: [String],
        attribution: String,
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['OFFICIAL_REGISTRY', 'THIRD_PARTY_VERIFIED', 'ADMIN_VERIFIED', 'COMMUNITY_SUBMITTED', 'PENDING_VERIFICATION', 'EVIDENCE_ANALYZED'],
      default: 'THIRD_PARTY_VERIFIED',
    },
    lastVerifiedAt: Date,
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.slug || ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const normalizeForSearch = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\b(private limited|pvt ltd|pvt\. ltd\.|pvt limited|limited|ltd|inc|incorporated|corporation|corp|llc|llp|gmbh|s\.a\.|sa)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

companySchema.pre('save', function (next) {
  if (this.name) {
    this.normalizedName = normalizeForSearch(this.name);
  }
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  if (this.website && !this.domain) {
    try {
      const parsedUrl = this.website.startsWith('http') ? new URL(this.website) : new URL(`https://${this.website}`);
      this.domain = parsedUrl.hostname.replace(/^www\./, '');
    } catch {
      // Keep domain as is
    }
  }
  next();
});

companySchema.index({ normalizedName: 1, industry: 1, location: 1, country: 1, city: 1 });
companySchema.index({ aliases: 1 });
companySchema.index({ domain: 1 });
companySchema.index({ registrationNumber: 1, jurisdiction: 1 });
companySchema.index({ verificationStatus: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;

