const SavedCompany = require('../models/SavedCompany');
const Company = require('../models/Company');
const CompanyIntelligence = require('../models/CompanyIntelligence');
const CareerDNA = require('../models/CareerDNA');
const scoringService = require('./scoringService');
const AppError = require('../utils/appError');

class SavedCompanyService {
  async getSavedCompanies(userId) {
    const saved = await SavedCompany.find({ userId }).populate('companyId').lean();
    const dna = await CareerDNA.findOne({ userId }).lean();
    const userPriorities = dna?.priorities || null;

    const companyIds = saved.map((s) => s.companyId?._id).filter(Boolean);
    const intelligences = await CompanyIntelligence.find({ companyId: { $in: companyIds } }).lean();

    const intelMap = new Map();
    intelligences.forEach((intel) => intelMap.set(intel.companySlug, intel));

    return saved
      .filter((s) => s.companyId)
      .map((s) => {
        const comp = s.companyId;
        const intel = intelMap.get(comp.slug) || {};
        const categories = intel.categories || {};

        let careerFit = null;
        if (userPriorities) {
          careerFit = scoringService.calculateCareerFit({ ...comp, categories }, userPriorities);
        }

        return {
          id: comp.slug,
          _id: comp._id,
          name: comp.name,
          shortName: comp.shortName || comp.name,
          logoText: comp.logoText,
          logoBg: comp.logoBg,
          logoColor: comp.logoColor,
          industry: comp.industry,
          location: comp.location,
          website: comp.website,
          overallScore: comp.overallScore,
          overallScoreMax: comp.overallScoreMax || 100,
          confidence: comp.confidence,
          reviewCount: comp.reviewCount,
          sampleSourcesSummary: comp.sampleSourcesSummary,
          lastUpdated: 'Oct 2026',
          positiveSignals: intel.positiveSignals || [],
          concernSignals: intel.concernSignals || [],
          careerFit,
          isSaved: true,
          isDemoData: comp.isDemoData,
        };
      });
  }

  async saveCompany(userId, companyIdOrSlug) {
    let company = await Company.findOne({ slug: companyIdOrSlug.toLowerCase() });
    if (!company && companyIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(companyIdOrSlug);
    }
    if (!company) {
      throw new AppError(`Company not found with identifier: ${companyIdOrSlug}`, 404, 'COMPANY_NOT_FOUND');
    }

    // Upsert to gracefully avoid duplicates
    await SavedCompany.findOneAndUpdate(
      { userId, companyId: company._id },
      { userId, companyId: company._id, companySlug: company.slug },
      { upsert: true, new: true }
    );

    return {
      companyId: company.slug,
      isSaved: true,
    };
  }

  async unsaveCompany(userId, companyIdOrSlug) {
    let company = await Company.findOne({ slug: companyIdOrSlug.toLowerCase() });
    if (!company && companyIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(companyIdOrSlug);
    }
    if (!company) {
      throw new AppError(`Company not found with identifier: ${companyIdOrSlug}`, 404, 'COMPANY_NOT_FOUND');
    }

    await SavedCompany.findOneAndDelete({ userId, companyId: company._id });

    return {
      companyId: company.slug,
      isSaved: false,
    };
  }
}

module.exports = new SavedCompanyService();

