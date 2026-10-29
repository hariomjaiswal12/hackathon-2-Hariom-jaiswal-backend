const Company = require('../models/Company');
const CompanyIntelligence = require('../models/CompanyIntelligence');
const CareerDNA = require('../models/CareerDNA');
const SavedCompany = require('../models/SavedCompany');
const ComparisonScenario = require('../models/ComparisonScenario');
const ResearchHistory = require('../models/ResearchHistory');
const scoringService = require('./scoringService');

class DashboardService {
  async getDashboardData(userId) {
    // 1. Fetch user Career DNA
    let dna = null;
    if (userId) {
      dna = await CareerDNA.findOne({ userId }).lean();
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

    // 2. Fetch stats
    const [savedCount, comparisonsCount, historyCount] = await Promise.all([
      userId ? SavedCompany.countDocuments({ userId }) : 5,
      userId ? ComparisonScenario.countDocuments({ userId }) : 4,
      userId ? ResearchHistory.countDocuments({ userId, type: 'Company' }) : 12,
    ]);

    // 3. Fetch companies and calculate recommended
    const companies = await Company.find({}).lean();
    const intelligences = await CompanyIntelligence.find({}).lean();
    const intelMap = new Map();
    intelligences.forEach((intel) => intelMap.set(intel.companySlug, intel));

    const enriched = companies.map((c) => {
      const intel = intelMap.get(c.slug) || {};
      const categories = intel.categories || {};
      const careerFit = scoringService.calculateCareerFit({ ...c, categories }, priorities);

      return {
        id: c.slug,
        _id: c._id,
        name: c.name,
        shortName: c.shortName || c.name,
        logoText: c.logoText,
        logoBg: c.logoBg,
        logoColor: c.logoColor,
        industry: c.industry,
        location: c.location,
        overallScore: c.overallScore,
        confidence: c.confidence,
        reviewCount: c.reviewCount,
        sampleSourcesSummary: c.sampleSourcesSummary,
        positiveSignals: intel.positiveSignals || [],
        concernSignals: intel.concernSignals || [],
        careerFit,
        isDemoData: c.isDemoData,
      };
    });

    // Sort by fitScore descending
    enriched.sort((a, b) => (b.careerFit?.fitScore || 0) - (a.careerFit?.fitScore || 0));

    // Recommend top 3 companies (TCS, Infosys, Accenture matching page 5)
    const recommendedCompanies = enriched.slice(0, 3);

    // 4. Fetch recent research
    let recentHistory = [];
    if (userId) {
      recentHistory = await ResearchHistory.find({ userId, type: 'Company' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    let recentResearch = [];
    if (userId) {
      recentResearch = recentHistory.map((h) => {
        const match = enriched.find((c) => c.id === h.companySlug) || enriched[0];
        return {
          company: match?.shortName || h.companySlug,
          companySlug: match?.id || h.companySlug,
          lastResearched: h.time || 'Recent',
          careerFit: match?.careerFit?.fitScore ? `${match.careerFit.fitScore}% ${match.careerFit.tier}` : 'Grounded Research',
          nextStep: 'Continue research',
        };
      });
    } else {
      recentResearch = [
        { companySlug: 'tcs', time: 'Today · 10:42 AM' },
        { companySlug: 'accenture', time: 'Oct 28, 2026' },
        { companySlug: 'infosys', time: 'Oct 25, 2026' },
      ].map((h) => {
        const match = enriched.find((c) => c.id === h.companySlug) || enriched[0];
        return {
          company: match?.shortName || 'TCS',
          companySlug: match?.id || 'tcs',
          lastResearched: h.time || 'Recent',
          careerFit: `${match?.careerFit?.fitScore}% ${match?.careerFit?.tier}`,
          nextStep: 'Continue research',
        };
      });
    }

    return {
      stats: {
        companiesResearched: userId ? historyCount : 12,
        savedCompanies: userId ? savedCount : 5,
        comparisons: userId ? comparisonsCount : 4,
        careerFitProfile: dna ? (dna.isComplete ? 'Complete' : 'In progress') : (userId ? 'Not configured' : 'Starter Profile'),
        lastUpdated: dna?.updatedAt ? new Date(dna.updatedAt).toLocaleDateString() : 'Oct 18, 2026',
      },
      careerDNA: {
        name: dna?.name || 'Candidate',
        targetRole: dna?.targetRole || 'Backend Developer',
        experience: dna?.experience || 'Fresher',
        workStyle: dna?.workStyle || 'Hybrid',
        priorities,
        skills: dna?.skills || ['JavaScript', 'Node.js', 'Python', 'SQL'],
        isComplete: dna?.isComplete ?? true,
      },
      recommendedCompanies,
      recentResearch,
    };
  }
}

module.exports = new DashboardService();

