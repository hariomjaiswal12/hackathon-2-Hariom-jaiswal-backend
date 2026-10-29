const Company = require('../models/Company');
const CompanyIntelligence = require('../models/CompanyIntelligence');
const CareerDNA = require('../models/CareerDNA');
const ComparisonScenario = require('../models/ComparisonScenario');
const scoringService = require('./scoringService');
const AppError = require('../utils/appError');

class ScenarioService {
  async calculateScenario(priorities, companyIds = ['accenture', 'tcs', 'infosys'], userId = null) {
    if (!priorities || typeof priorities !== 'object' || Array.isArray(priorities)) {
      throw new AppError('Valid priorities object required for scenario calculation.', 400, 'INVALID_PRIORITIES');
    }

    // Validate priority weights (0 to 100)
    for (const [key, val] of Object.entries(priorities)) {
      if (typeof val !== 'number' || isNaN(val) || val < 0 || val > 100) {
        throw new AppError(`Priority weight for "${key}" must be a number between 0 and 100.`, 400, 'INVALID_PRIORITY_WEIGHT');
      }
    }

    // 1. Get baseline priorities (from user's saved Career DNA or standard baseline)
    let baselinePriorities = {
      learning: 95,
      growth: 90,
      stability: 85,
      culture: 80,
      wlb: 75,
      salary: 70,
      technology: 90,
      location: 60,
    };

    if (userId) {
      const dna = await CareerDNA.findOne({ userId }).lean();
      if (dna && dna.priorities) {
        baselinePriorities = { ...baselinePriorities, ...dna.priorities };
      }
    }

    // Handle empty company selection
    if (Array.isArray(companyIds) && companyIds.length === 0) {
      return {
        baselineRankings: [],
        scenarioRankings: [],
        delta: [],
        shifts: [],
        changedCategories: [],
        explanation: 'Select at least one company to simulate priorities and calculate What-If rankings.',
        keyTakeaway: 'No companies selected',
        savedDNARemainsUnchanged: true,
        priorities,
        baselinePriorities,
      };
    }

    // 2. Normalize company queries and fetch companies
    const effectiveCompanyIds = Array.isArray(companyIds) ? companyIds : ['accenture', 'tcs', 'infosys'];
    const normalizedSlugs = effectiveCompanyIds.map((s) => (s ? String(s).toLowerCase().trim() : ''));
    const objectIds = effectiveCompanyIds.filter((id) => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

    const companies = await Company.find({
      $or: [
        { slug: { $in: normalizedSlugs } },
        { _id: { $in: objectIds } },
        { shortName: { $in: effectiveCompanyIds } },
        { name: { $in: effectiveCompanyIds } },
      ],
    }).lean();

    // Dynamically discover valid external web entities if not already cached in DB
    const foundSlugs = new Set(companies.map((c) => (c.slug ? c.slug.toLowerCase() : '')));
    const missingSlugs = normalizedSlugs.filter((s) => s && !foundSlugs.has(s));

    if (missingSlugs.length > 0) {
      const companyDiscoveryService = require('./companyDiscoveryService');
      for (const missingSlug of missingSlugs) {
        try {
          const discovered = await companyDiscoveryService.searchExternalProviders(missingSlug, { limit: 1 });
          if (discovered && discovered.length > 0) {
            const ext = discovered[0];
            const newComp = await Company.create({
              ...ext,
              isDemoData: false,
              overallScore: null,
              overallScoreMax: 100,
              reviewCount: 0,
            }).then((doc) => doc.toObject()).catch(() => null);
            if (newComp) {
              companies.push(newComp);
              foundSlugs.add(newComp.slug.toLowerCase());
            }
          }
        } catch (_) {}
      }
    }

    if (companies.length === 0) {
      return {
        baselineRankings: [],
        scenarioRankings: [],
        delta: [],
        shifts: [],
        changedCategories: [],
        explanation: 'None of the requested company IDs were found in the database.',
        keyTakeaway: 'No matching companies found',
        savedDNARemainsUnchanged: true,
        priorities,
        baselinePriorities,
      };
    }

    const intelligences = await CompanyIntelligence.find({
      companyId: { $in: companies.map((c) => c._id) },
    }).lean();

    const intelMap = new Map();
    intelligences.forEach((intel) => intelMap.set(intel.companySlug, intel));

    // 3. Compute baseline rankings
    const baselineResults = companies.map((comp) => {
      const intel = intelMap.get(comp.slug) || {};
      const categories = intel.categories || {};
      const fit = scoringService.calculateCareerFit({ ...comp, categories }, baselinePriorities);
      return {
        companyId: comp.slug,
        companyName: comp.shortName || comp.name,
        fullName: comp.name,
        logoBg: comp.logoBg || '#1E293B',
        logoText: comp.logoText || (comp.shortName ? comp.shortName.slice(0, 3) : 'CIQ'),
        industry: comp.industry || 'Technology',
        location: comp.locations?.[0] || comp.location || 'India',
        size: comp.size || 'Enterprise',
        score: fit.fitScore,
        tier: fit.tier,
        hasSufficientData: fit.hasSufficientData !== false && fit.fitScore !== null,
        partialCoverage: !!fit.partialCoverage,
        coverageNote: fit.coverageNote,
        breakdown: fit.breakdown,
        whyItFits: fit.whyItFits,
        tradeOffs: fit.tradeOffs,
      };
    });

    // Stable sort: valid scores descending, tied scores sorted alphabetically by name, null scores at end
    baselineResults.sort((a, b) => {
      if (a.score === null && b.score === null) return a.companyName.localeCompare(b.companyName);
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (b.score !== a.score) return b.score - a.score;
      return a.companyName.localeCompare(b.companyName);
    });

    const baselineRankings = baselineResults.map((r, i) => ({
      ...r,
      rank: r.score !== null ? i + 1 : null,
    }));

    // 4. Compute scenario rankings with modified priorities
    // NON-NEGOTIABLE RULE: Saved Career DNA is NOT mutated!
    const scenarioResults = companies.map((comp) => {
      const intel = intelMap.get(comp.slug) || {};
      const categories = intel.categories || {};
      const fit = scoringService.calculateCareerFit({ ...comp, categories }, priorities);
      return {
        companyId: comp.slug,
        companyName: comp.shortName || comp.name,
        fullName: comp.name,
        logoBg: comp.logoBg || '#1E293B',
        logoText: comp.logoText || (comp.shortName ? comp.shortName.slice(0, 3) : 'CIQ'),
        industry: comp.industry || 'Technology',
        location: comp.locations?.[0] || comp.location || 'India',
        size: comp.size || 'Enterprise',
        score: fit.fitScore,
        tier: fit.tier,
        hasSufficientData: fit.hasSufficientData !== false && fit.fitScore !== null,
        partialCoverage: !!fit.partialCoverage,
        coverageNote: fit.coverageNote,
        breakdown: fit.breakdown,
        whyItFits: fit.whyItFits,
        tradeOffs: fit.tradeOffs,
      };
    });

    scenarioResults.sort((a, b) => {
      if (a.score === null && b.score === null) return a.companyName.localeCompare(b.companyName);
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      if (b.score !== a.score) return b.score - a.score;
      return a.companyName.localeCompare(b.companyName);
    });

    const scenarioRankings = scenarioResults.map((r, i) => ({
      ...r,
      rank: r.score !== null ? i + 1 : null,
    }));

    // 5. Calculate deltas and rank shifts
    const delta = scenarioRankings.map((scen) => {
      const base = baselineRankings.find((b) => b.companyId === scen.companyId) || {
        score: scen.score,
        rank: scen.rank,
      };

      const hasBothScores = scen.score !== null && base.score !== null;
      const scoreDiff = hasBothScores ? scen.score - base.score : null;
      const rankDiff = (scen.rank !== null && base.rank !== null) ? base.rank - scen.rank : null; // Positive means climbed in ranking

      let scenarioChange = 'No change';
      if (!scen.hasSufficientData) {
        scenarioChange = 'Insufficient data';
      } else if (scoreDiff !== null) {
        if (scoreDiff > 0) scenarioChange = `+${scoreDiff} points`;
        else if (scoreDiff < 0) scenarioChange = `${scoreDiff} points`;
        else scenarioChange = 'No change';
      }

      return {
        companyId: scen.companyId,
        companyName: scen.companyName,
        logoBg: scen.logoBg,
        logoText: scen.logoText,
        industry: scen.industry,
        location: scen.location,
        size: scen.size,
        hasSufficientData: scen.hasSufficientData,
        coverageNote: scen.coverageNote,
        baselineScore: base.score,
        baselineRank: base.rank,
        scenarioScore: scen.score,
        scenarioRank: scen.rank,
        scoreDiff,
        rankDiff,
        scenarioChange,
      };
    });

    // 6. Identify changed categories
    const changedCategories = [];
    for (const [k, v] of Object.entries(priorities)) {
      if (baselinePriorities[k] !== undefined && baselinePriorities[k] !== v) {
        changedCategories.push({
          category: k,
          from: baselinePriorities[k],
          to: v,
        });
      }
    }

    // 7. Generate explanation and key takeaway
    const validScenarios = scenarioRankings.filter((s) => s.hasSufficientData);
    const validBaselines = baselineRankings.filter((s) => s.hasSufficientData);

    let explanation = `When priorities shift, personal alignment changes while company evidence remains fixed.`;
    let keyTakeaway = 'Balanced Priorities';

    if (validScenarios.length > 0) {
      const newLeader = validScenarios[0];
      const oldLeader = validBaselines[0];

      if (oldLeader && newLeader.companyId !== oldLeader.companyId) {
        keyTakeaway = `Why ${newLeader.companyName} moved to #1`;
        explanation = `${newLeader.companyName} moved to #1 because your changed priorities (${changedCategories.map((c) => `${c.category.toUpperCase()} ${c.from} → ${c.to}`).join(', ') || 'custom weighting'}) give greater weight to categories where they hold stronger relative evidence. This changes alignment — not company quality.`;
      } else {
        keyTakeaway = `Why ${newLeader.companyName} leads this scenario`;
        explanation = `${newLeader.companyName} maintains #1 with strong signals across your selected priorities (${newLeader.score}% fit). Company evidence is empirical and independent of priority adjustments.`;
      }
    } else {
      keyTakeaway = 'Insufficient Evidence';
      explanation = 'None of the selected companies currently have sufficient verified workplace evidence to compute Career Fit.';
    }

    return {
      baselineRankings,
      scenarioRankings,
      delta,
      shifts: delta, // Alias for backward compatibility
      changedCategories,
      explanation,
      keyTakeaway,
      savedDNARemainsUnchanged: true,
      priorities,
      baselinePriorities,
    };
  }

  async saveScenario(userId, scenarioData) {
    const { title, description, priorities, companyIds = ['accenture', 'tcs', 'infosys'], companies } = scenarioData;
    const comps = companies || companyIds || ['accenture', 'tcs', 'infosys'];

    const calc = await this.calculateScenario(priorities, comps, userId);

    const scenario = await ComparisonScenario.create({
      userId,
      title: title || 'Custom What-If Scenario',
      description:
        description ||
        calc.scenarioRankings
          .filter((r) => r.hasSufficientData)
          .map((r) => `${r.companyName} ${r.score}%`)
          .join(' · ') ||
        'Custom simulated scenario',
      companies: comps,
      scenarioType: 'what-if',
      priorities,
      rankings: calc.scenarioRankings,
      comparisonData: calc,
    });

    return {
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      companies: scenario.companies,
      priorities: scenario.priorities,
      rankings: scenario.rankings,
      explanation: calc.explanation,
      createdAt: scenario.createdAt,
    };
  }

  async getScenarios(userId) {
    return ComparisonScenario.find({ userId, scenarioType: 'what-if' }).sort({ createdAt: -1 }).lean();
  }

  async getScenarioById(userId, id) {
    const scen = await ComparisonScenario.findOne({ _id: id, userId, scenarioType: 'what-if' }).lean();
    if (!scen) {
      throw new AppError('What-If scenario not found', 404, 'SCENARIO_NOT_FOUND');
    }
    return scen;
  }

  async deleteScenario(userId, id) {
    const result = await ComparisonScenario.findOneAndDelete({ _id: id, userId, scenarioType: 'what-if' });
    if (!result) {
      throw new AppError('What-If scenario not found', 404, 'SCENARIO_NOT_FOUND');
    }
    return true;
  }
}

module.exports = new ScenarioService();
