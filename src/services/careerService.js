const CareerDNA = require('../models/CareerDNA');
const Company = require('../models/Company');
const CompanyIntelligence = require('../models/CompanyIntelligence');
const scoringService = require('./scoringService');
const AppError = require('../utils/appError');

class CareerService {
  async getCareerDNA(userId, userName = 'User') {
    let dna = await CareerDNA.findOne({ userId }).lean();
    if (!dna) {
      // Auto-create default Career DNA
      dna = await CareerDNA.create({
        userId,
        name: userName,
        targetRole: 'Backend Developer',
        experience: 'Fresher',
        workStyle: 'Hybrid',
        preferredLocation: 'Bangalore, India',
        priorities: {
          learning: 95,
          growth: 90,
          stability: 85,
          culture: 80,
          wlb: 75,
          salary: 70,
          technology: 90,
          location: 60,
        },
        skills: ['JavaScript', 'Node.js', 'Python', 'SQL'],
        isComplete: true,
      });
    }

    return {
      id: dna._id,
      name: dna.name,
      targetRole: dna.targetRole,
      experience: dna.experience,
      workStyle: dna.workStyle,
      preferredLocation: dna.preferredLocation,
      priorities: dna.priorities,
      skills: dna.skills,
      isComplete: dna.isComplete,
      updatedAt: dna.updatedAt,
    };
  }

  async saveOrUpdateCareerDNA(userId, data, userName = 'User') {
    const update = {
      name: data.name || userName,
      targetRole: data.targetRole || 'Backend Developer',
      experience: data.experience || 'Fresher',
      workStyle: data.workStyle || 'Hybrid',
      preferredLocation: data.preferredLocation || 'Bangalore, India',
      priorities: {
        learning: data.priorities?.learning ?? 95,
        growth: data.priorities?.growth ?? 90,
        stability: data.priorities?.stability ?? 85,
        culture: data.priorities?.culture ?? 80,
        wlb: data.priorities?.wlb ?? 75,
        salary: data.priorities?.salary ?? 70,
        technology: data.priorities?.technology ?? 90,
        location: data.priorities?.location ?? 60,
      },
      skills: data.skills || ['JavaScript', 'Node.js', 'Python', 'SQL'],
      isComplete: data.isComplete !== undefined ? data.isComplete : true,
    };

    const dna = await CareerDNA.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
      runValidators: true,
    }).lean();

    return {
      id: dna._id,
      name: dna.name,
      targetRole: dna.targetRole,
      experience: dna.experience,
      workStyle: dna.workStyle,
      preferredLocation: dna.preferredLocation,
      priorities: dna.priorities,
      skills: dna.skills,
      isComplete: dna.isComplete,
      updatedAt: dna.updatedAt,
    };
  }

  async deleteCareerDNA(userId) {
    await CareerDNA.findOneAndDelete({ userId });
    return true;
  }

  async getAllCareerFits(userId) {
    const dna = await this.getCareerDNA(userId);
    const companies = await Company.find({}).lean();
    const intelligences = await CompanyIntelligence.find({
      companyId: { $in: companies.map((c) => c._id) },
    }).lean();

    const Job = require('../models/Job');
    const allJobs = await Job.find({ status: 'ACTIVE' }).lean();
    const jobsByCompany = new Map();
    allJobs.forEach((j) => {
      const arr = jobsByCompany.get(j.companySlug) || [];
      arr.push(j);
      jobsByCompany.set(j.companySlug, arr);
    });

    const intelMap = new Map();
    intelligences.forEach((intel) => intelMap.set(intel.companySlug, intel));

    const matches = companies.map((comp) => {
      const intel = intelMap.get(comp.slug) || {};
      const categories = intel.categories || {};
      const compJobs = jobsByCompany.get(comp.slug) || [];
      return scoringService.calculateCareerFit(
        { ...comp, categories },
        dna.priorities,
        {
          targetRole: dna.targetRole,
          experience: dna.experience,
          skills: dna.skills,
          verifiedJobs: compJobs,
          requireRoleEvidence: false,
        }
      );
    });

    // Sort by fitScore descending
    matches.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

    return {
      userProfile: {
        name: dna.name,
        targetRole: dna.targetRole,
        experience: dna.experience,
        priorities: dna.priorities,
      },
      matches,
    };
  }

  async getCompanyCareerFit(userId, companyIdOrSlug, options = {}) {
    let dna = null;
    if (userId) {
      dna = await this.getCareerDNA(userId);
    }
    const priorities = dna?.priorities || {
      learning: 95,
      growth: 90,
      stability: 85,
      culture: 80,
      wlb: 75,
      salary: 70,
      technology: 90,
      location: 60,
    };

    let company = await Company.findOne({ slug: companyIdOrSlug.toLowerCase() }).lean();
    if (!company && companyIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(companyIdOrSlug).lean();
    }
    if (!company) {
      throw new AppError(`Company not found with identifier: ${companyIdOrSlug}`, 404, 'COMPANY_NOT_FOUND');
    }

    const intel = await CompanyIntelligence.findOne({ companyId: company._id }).lean();
    const categories = intel?.categories || {};

    const targetRole = options.role || options.targetRole || dna?.targetRole || null;
    const experience = options.experience || dna?.experience || 'Fresher';
    const requireRoleEvidence = options.requireRoleEvidence !== undefined ? options.requireRoleEvidence : !!targetRole;

    const Job = require('../models/Job');
    const verifiedJobs = await Job.find({ companySlug: company.slug, status: 'ACTIVE' }).lean();

    return scoringService.calculateCareerFit(
      { ...company, categories },
      priorities,
      {
        targetRole,
        experience,
        skills: dna?.skills || [],
        verifiedJobs,
        requireRoleEvidence,
      }
    );
  }
}

module.exports = new CareerService();

