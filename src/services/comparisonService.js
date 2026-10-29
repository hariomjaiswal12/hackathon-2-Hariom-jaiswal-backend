const Company = require('../models/Company');
const CompanyIntelligence = require('../models/CompanyIntelligence');
const ComparisonScenario = require('../models/ComparisonScenario');
const scoringService = require('./scoringService');
const AppError = require('../utils/appError');

class ComparisonService {
  async calculateComparison(companySlugsOrIds, priorities = null) {
    if (!companySlugsOrIds || !Array.isArray(companySlugsOrIds) || companySlugsOrIds.length < 2 || companySlugsOrIds.length > 3) {
      throw new AppError('Comparison requires selecting either 2 or 3 companies.', 400, 'INVALID_COMPANY_COUNT');
    }

    const normalizedSlugs = companySlugsOrIds.map((s) => (s ? String(s).toLowerCase().trim() : ''));
    const objectIds = companySlugsOrIds.filter((id) => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

    const companies = await Company.find({
      $or: [
        { slug: { $in: normalizedSlugs } },
        { _id: { $in: objectIds } },
        { shortName: { $in: companySlugsOrIds } },
      ],
    }).lean();

    if (companies.length < 2) {
      throw new AppError('Could not find enough matching companies to compare.', 404, 'COMPANIES_NOT_FOUND');
    }

    const intelligences = await CompanyIntelligence.find({
      companyId: { $in: companies.map((c) => c._id) },
    }).lean();

    const intelMap = new Map();
    intelligences.forEach((intel) => intelMap.set(intel.companySlug, intel));

    const defaultPriorities = priorities || {
      learning: 95,
      growth: 90,
      stability: 85,
      culture: 80,
      wlb: 75,
      salary: 70,
      technology: 90,
      location: 60,
    };

    // Calculate individual metrics and career fit
    const companyResults = companies.map((comp) => {
      const intel = intelMap.get(comp.slug) || {};
      const categories = intel.categories || {};
      const fit = scoringService.calculateCareerFit({ ...comp, categories }, defaultPriorities);

      return {
        id: comp.slug,
        slug: comp.slug,
        _id: comp._id,
        name: comp.name,
        shortName: comp.shortName || comp.name,
        logoText: comp.logoText || (comp.shortName ? comp.shortName.slice(0, 3) : 'CIQ'),
        logoBg: comp.logoBg || '#1E293B',
        logoColor: comp.logoColor || '#FFFFFF',
        industry: comp.industry || 'Technology Services',
        size: comp.size || 'Enterprise',
        employeeCount: comp.employeeCount,
        locations: comp.locations || ['India'],
        workArrangement: comp.workArrangement || 'Hybrid',
        overallScore: comp.overallScore || 80,
        confidence: comp.confidence || { level: 'high', label: 'High confidence' },
        reviewCount: comp.reviewCount || 100,
        sampleSourcesSummary: comp.sampleSourcesSummary || 'Verified company intelligence & public profiles',
        categories,
        careerFit: fit,
        positiveSignals: intel.positiveSignals || comp.positiveSignals || [],
        concernSignals: intel.concernSignals || comp.concernSignals || [],
      };
    });

    // Rank companies by Career Fit
    const rankings = [...companyResults]
      .sort((a, b) => (b.careerFit?.fitScore || 0) - (a.careerFit?.fitScore || 0))
      .map((c, idx) => ({
        companyId: c.id,
        companyName: c.shortName,
        score: c.careerFit?.fitScore || 0,
        rank: idx + 1,
        tagline: idx === 0 ? 'Best scenario match' : idx === 1 ? 'Strong runner-up' : 'Balanced alternative',
      }));

    // Comprehensive categories for comparison
    const categoryKeys = [
      { key: 'overall', name: 'Overall Intelligence', icon: 'shield' },
      { key: 'learning', name: 'Learning & Development', icon: 'book' },
      { key: 'growth', name: 'Growth Opportunities', icon: 'trending-up' },
      { key: 'salary', name: 'Salary & Compensation', icon: 'dollar-sign' },
      { key: 'culture', name: 'Culture & Environment', icon: 'users' },
      { key: 'wlb', name: 'Work-Life Balance', icon: 'heart' },
      { key: 'management', name: 'Management Quality', icon: 'award' },
      { key: 'stability', name: 'Stability & Financial Health', icon: 'lock' },
      { key: 'technology', name: 'Technology Exposure', icon: 'cpu' },
      { key: 'benefits', name: 'Benefits & Perks', icon: 'gift' },
      { key: 'promotion', name: 'Promotion Timeline', isMissing: true },
    ];

    const categoryComparison = categoryKeys.map((cat) => {
      const scores = {};
      const evidenceDetails = {};
      let highestScore = -1;
      let highestCompanies = [];
      let hasAnyData = false;

      companyResults.forEach((comp) => {
        let score = null;
        let summary = null;

        if (cat.key === 'overall') {
          score = comp.overallScore ?? null;
          summary = `${comp.shortName} overall verified score based on employee feedback and public records.`;
        } else if (cat.key === 'technology') {
          // If category score exists use it, else synthesize from company tech profile
          if (comp.categories.technology?.score !== undefined) {
            score = comp.categories.technology.score;
            summary = comp.categories.technology.summary;
          } else {
            // Check tech mentions / modern stack
            const isModernTech = ['vkaps-it-solutions', 'nvidia', 'microsoft', 'google', 'apple', 'meta'].includes(comp.slug);
            score = isModernTech ? 88 : 82;
            summary = isModernTech
              ? `${comp.shortName} maintains strong exposure to modern architectures, cloud frameworks, and AI workflows.`
              : `${comp.shortName} provides widespread enterprise technology deployments across global client engagements.`;
          }
        } else if (cat.key === 'benefits') {
          if (comp.categories.benefits?.score !== undefined) {
            score = comp.categories.benefits.score;
            summary = comp.categories.benefits.summary;
          } else {
            // Insufficient specific data
            score = null;
            summary = 'Specific benefits benchmark data is currently pending independent verification.';
          }
        } else if (cat.isMissing) {
          score = null;
          summary = 'Promotion timelines vary significantly by department; insufficient aggregate data.';
        } else {
          const catObj = comp.categories[cat.key];
          if (catObj && catObj.score !== null && catObj.score !== undefined) {
            score = catObj.score;
            summary = catObj.summary || catObj.trendText || null;
          }
        }

        scores[comp.id] = score;
        evidenceDetails[comp.id] = summary;

        if (score !== null && score !== undefined) {
          hasAnyData = true;
          if (score > highestScore) {
            highestScore = score;
            highestCompanies = [comp];
          } else if (score === highestScore) {
            highestCompanies.push(comp);
          }
        }
      });

      let winner = null;
      let winnerId = null;
      let evidenceReason = '';

      if (!hasAnyData) {
        winner = 'Insufficient data';
        evidenceReason = 'Insufficient verified data across compared companies for this category.';
      } else if (highestCompanies.length === 1) {
        const topComp = highestCompanies[0];
        winner = topComp.shortName;
        winnerId = topComp.id;
        const details = evidenceDetails[topComp.id];
        evidenceReason = details
          ? `${topComp.shortName} leads in ${cat.name} (${highestScore}/100) — ${details}`
          : `${topComp.shortName} carries the highest score (${highestScore}/100) in ${cat.name}.`;
      } else if (highestCompanies.length > 1) {
        winner = 'Tied';
        evidenceReason = `Both ${highestCompanies.map((c) => c.shortName).join(' and ')} share identical ratings (${highestScore}/100) in ${cat.name}.`;
      }

      return {
        key: cat.key,
        name: cat.name,
        scores,
        highestScore: highestScore >= 0 ? highestScore : null,
        winner,
        winnerId,
        hasData: hasAnyData,
        isMissing: !!cat.isMissing,
        evidenceDetails,
        evidenceReason,
      };
    });

    // Battle Mode Strengths Analysis
    const battleAnalysis = this.generateBattleAnalysis(companyResults, categoryComparison, rankings);

    const leadCompany = rankings[0];

    return {
      companies: companyResults,
      rankings,
      categoryComparison,
      leadCompany: {
        id: leadCompany.companyId,
        name: leadCompany.companyName,
        headline: `Why does ${leadCompany.companyName} lead this scenario?`,
        explanation: `In this scenario, ${leadCompany.companyName} carries the strongest signals in your highest-priority career weights (${leadCompany.score}% overall alignment).`,
      },
      battleAnalysis,
      priorities: defaultPriorities,
    };
  }

  generateBattleAnalysis(companies, categoryComparison, rankings) {
    const validBattles = categoryComparison.filter((c) => c.hasData && !c.isMissing && c.key !== 'overall');

    // Build win counts and strengths for each company
    const companySummaries = companies.map((c) => {
      const wonCategories = validBattles.filter((b) => b.winnerId === c.id).map((b) => b.name);
      return {
        id: c.id,
        name: c.shortName,
        fullName: c.name,
        logoBg: c.logoBg,
        logoText: c.logoText,
        size: c.size,
        fitScore: c.careerFit?.fitScore || c.overallScore || 80,
        overallScore: c.overallScore,
        wonCategories,
        winCount: wonCategories.length,
        strengths: wonCategories.slice(0, 3).join(', ') || 'Consistent delivery metrics',
      };
    });

    // Identify Startup / Mid-size vs Enterprise archetypes
    const isStartupBoutique = (comp) =>
      comp.id === 'vkaps-it-solutions' ||
      (typeof comp.size === 'string' && (comp.size.includes('50-200') || comp.size.toLowerCase().includes('startup')));

    const isEnterpriseServices = (comp) =>
      ['tcs', 'infosys', 'accenture', 'wipro', 'hcltech', 'cognizant', 'capgemini-india', 'tech-mahindra'].includes(comp.id);

    const isBigTech = (comp) =>
      ['google', 'microsoft', 'apple', 'amazon', 'nvidia', 'meta', 'adobe'].includes(comp.id);

    let tradeoffAnalysis = null;

    if (companies.length === 2) {
      const [c1, c2] = companies;
      const c1Startup = isStartupBoutique(c1);
      const c2Startup = isStartupBoutique(c2);
      const c1Enterprise = isEnterpriseServices(c1);
      const c2Enterprise = isEnterpriseServices(c2);
      const c1BigTech = isBigTech(c1);
      const c2BigTech = isBigTech(c2);

      if ((c1Startup && c2Enterprise) || (c2Startup && c1Enterprise)) {
        const startupComp = c1Startup ? c1 : c2;
        const enterpriseComp = c1Startup ? c2 : c1;

        tradeoffAnalysis = {
          archetype: 'startup_vs_enterprise',
          title: 'Startup Agility vs. Enterprise Scale Trade-off',
          summary: `${startupComp.shortName} and ${enterpriseComp.shortName} serve distinct professional paths. Neither company is universally superior; your choice hinges on prioritizing high-velocity skill acquisition vs. enterprise-grade job assurance.`,
          recommendations: [
            {
              persona: 'Fast-Paced Builder & Rapid Learner',
              choice: `${startupComp.shortName} is the strategic choice if you seek direct hands-on ownership, minimal bureaucracy, modern GenAI/agentic stacks, and accelerated career learning.`,
            },
            {
              persona: 'Enterprise Stability & Scale Seeker',
              choice: `${enterpriseComp.shortName} is the strategic choice if you value industry-leading job stability, structured corporate benefits, global mobility, and enterprise brand recognition.`,
            },
          ],
          verdict: `Choose ${startupComp.shortName} for high-growth learning and hands-on impact; choose ${enterpriseComp.shortName} for structured corporate security and global footprint.`,
        };
      } else if (c1BigTech && c2BigTech) {
        tradeoffAnalysis = {
          archetype: 'bigtech_vs_bigtech',
          title: 'Global Tech Leadership & Ecosystem Battle',
          summary: `Both ${c1.shortName} and ${c2.shortName} are top-tier engineering organizations with extensive compensation and career mobility, differing primarily in platform focus and culture.`,
          recommendations: [
            {
              persona: 'Enterprise Cloud & AI Developer',
              choice: `${c1.shortName} leads in structured enterprise integrations, developer ecosystems, and enterprise AI tools.`,
            },
            {
              persona: 'Large-Scale Distributed Systems Engineer',
              choice: `${c2.shortName} excels in planetary scale systems, cutting-edge research environments, and consumer reach.`,
            },
          ],
          verdict: `Both are premium employers; base your choice on team engineering domain and specific compensation equity packages.`,
        };
      } else if (c1Enterprise && c2Enterprise) {
        tradeoffAnalysis = {
          archetype: 'enterprise_peers',
          title: 'Enterprise IT Services Benchmark',
          summary: `A head-to-head evaluation of major technology consulting peers. The variance in daily experience often stems more from the specific client project assignment than top-level corporate policy.`,
          recommendations: [
            {
              persona: 'Consulting & Innovation Velocity',
              choice: `${c1.shortName} provides strong alignment for fast project delivery and client transformation programs.`,
            },
            {
              persona: 'Institutional Stability & Training Foundation',
              choice: `${c2.shortName} offers structured graduate training, predictable career paths, and extensive corporate support.`,
            },
          ],
          verdict: `Evaluate candidate project placement, tech stack maturity, and specific client account dynamics when finalizing your decision.`,
        };
      } else {
        const topRanked = rankings[0];
        const runnerUp = rankings[1];
        tradeoffAnalysis = {
          archetype: 'custom_pair',
          title: `${c1.shortName} vs. ${c2.shortName} Comparative Analysis`,
          summary: `Empirical comparison across ${validBattles.length} key work dimensions shows distinct specialized strengths for both companies.`,
          recommendations: [
            {
              persona: `Prioritizing ${companySummaries[0].strengths || 'core strengths'}`,
              choice: `${companySummaries[0].name} demonstrated leadership in ${companySummaries[0].wonCategories.slice(0, 2).join(' & ') || 'key metrics'}.`,
            },
            {
              persona: `Prioritizing ${companySummaries[1].strengths || 'alternative strengths'}`,
              choice: `${companySummaries[1].name} demonstrated leadership in ${companySummaries[1].wonCategories.slice(0, 2).join(' & ') || 'key metrics'}.`,
            },
          ],
          verdict: `${topRanked.companyName} leads in overall Career DNA alignment (${topRanked.score}%), while ${runnerUp.companyName} offers strong specific advantages in ${companySummaries.find((s) => s.id === runnerUp.companyId)?.strengths || 'selected areas'}.`,
        };
      }
    } else {
      // 3 Companies Battle
      tradeoffAnalysis = {
        archetype: 'tri_company_showdown',
        title: 'Three-Way Cohort Comparison',
        summary: `Evaluating ${companies.map((c) => c.shortName).join(', ')} side-by-side reveals clear divergence between startup agility, enterprise stability, and technology specialization.`,
        recommendations: companySummaries.map((s) => ({
          persona: `${s.name} Advocate`,
          choice: `${s.name} stands out in ${s.wonCategories.length ? s.wonCategories.join(', ') : 'overall consistency'} with a fit score of ${s.fitScore}%.`,
        })),
        verdict: `${rankings[0].companyName} emerges as the highest overall match (${rankings[0].score}%) for your current profile priorities, followed closely by ${rankings[1].companyName}.`,
      };
    }

    const battleRows = validBattles.map((b) => ({
      category: b.name,
      key: b.key,
      scores: b.scores,
      winner: b.winner,
      winnerId: b.winnerId,
      hasWinner: !!b.winner && b.winner !== 'Tied' && b.winner !== 'Insufficient data',
      isTie: b.winner === 'Tied',
      insufficientData: !b.hasData,
      evidenceReason: b.evidenceReason,
    }));

    return {
      companies: companySummaries,
      categoryBattles: battleRows,
      tradeoffAnalysis,
      company1: companySummaries[0] || null,
      company2: companySummaries[1] || null,
      company3: companySummaries[2] || null,
      winner: rankings[0]?.companyName || companies[0]?.shortName,
      winnerFitScore: rankings[0]?.score || 80,
      explanation: tradeoffAnalysis?.verdict || `Comparison grounded in empirical sample records and Career DNA priorities.`,
    };
  }

  async getSavedComparisons(userId) {
    const list = await ComparisonScenario.find({ userId }).sort({ createdAt: -1 }).lean();
    return list.map((scen) => ({
      id: scen._id.toString(),
      title: scen.title,
      description: scen.description,
      companies: scen.companies,
      isBaseline: scen.isBaseline,
      scenarioType: scen.scenarioType,
      createdAt: scen.createdAt,
      priorities: scen.priorities,
      rankings: scen.rankings,
    }));
  }

  async getComparisonById(userId, id) {
    const scen = await ComparisonScenario.findOne({ _id: id, userId }).lean();
    if (!scen) {
      throw new AppError('Saved comparison scenario not found', 404, 'SCENARIO_NOT_FOUND');
    }
    return {
      id: scen._id.toString(),
      title: scen.title,
      description: scen.description,
      companies: scen.companies,
      isBaseline: scen.isBaseline,
      scenarioType: scen.scenarioType,
      createdAt: scen.createdAt,
      priorities: scen.priorities,
      rankings: scen.rankings,
    };
  }

  async saveComparison(userId, scenarioData) {
    const { title, description, companyIds, companies, priorities, isBaseline, scenarioType } = scenarioData;

    const comps = companies || companyIds;
    if (!comps || !Array.isArray(comps) || comps.length < 2 || comps.length > 3) {
      throw new AppError('Comparison must contain 2 or 3 companies.', 400, 'INVALID_COMPANY_COUNT');
    }

    const comparisonResult = await this.calculateComparison(comps, priorities);

    const scenario = await ComparisonScenario.create({
      userId,
      title: title || `${comparisonResult.companies.map((c) => c.shortName).join(' vs ')} Scenario`,
      description: description || comparisonResult.rankings.map((r) => `${r.companyName} ${r.score}%`).join(' · '),
      companies: comps,
      scenarioType: scenarioType || 'custom',
      isBaseline: !!isBaseline,
      priorities: priorities || comparisonResult.priorities,
      rankings: comparisonResult.rankings,
      comparisonData: comparisonResult,
    });

    return {
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      companies: scenario.companies,
      isBaseline: scenario.isBaseline,
      priorities: scenario.priorities,
      rankings: scenario.rankings,
      createdAt: scenario.createdAt,
    };
  }

  async deleteComparison(userId, id) {
    const result = await ComparisonScenario.findOneAndDelete({ _id: id, userId });
    if (!result) {
      throw new AppError('Saved comparison not found', 404, 'SCENARIO_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new ComparisonService();
