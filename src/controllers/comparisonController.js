const comparisonService = require('../services/comparisonService');
const CareerDNA = require('../models/CareerDNA');
const ResearchHistory = require('../models/ResearchHistory');
const { sendSuccess } = require('../utils/apiResponse');

const calculateComparison = async (req, res, next) => {
  try {
    const { companyIds, companies, scenario, priorities, customPriorities } = req.body;
    const effectiveCompanyIds = companyIds || companies;
    let effectivePriorities = priorities || customPriorities;

    if (!effectivePriorities && req.user) {
      const dna = await CareerDNA.findOne({ userId: req.user._id }).lean();
      if (dna) effectivePriorities = dna.priorities;
    }

    const result = await comparisonService.calculateComparison(effectiveCompanyIds, effectivePriorities);

    if (req.user && Array.isArray(effectiveCompanyIds)) {
      ResearchHistory.create({
        userId: req.user._id,
        activity: effectiveCompanyIds.join(' vs ').toUpperCase(),
        type: 'Comparison',
        context: scenario || 'Demo comparison scenario',
        link: '/compare',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateGroup: 'TODAY / OCT 28, 2026',
      }).catch(() => {});
    }

    return sendSuccess(res, result, 'Comparison calculated successfully');
  } catch (error) {
    next(error);
  }
};

const getSavedComparisons = async (req, res, next) => {
  try {
    const list = await comparisonService.getSavedComparisons(req.user._id);
    return sendSuccess(res, list, 'Saved comparisons retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getComparisonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scen = await comparisonService.getComparisonById(req.user._id, id);
    return sendSuccess(res, scen, 'Comparison retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const saveComparison = async (req, res, next) => {
  try {
    const scenario = await comparisonService.saveComparison(req.user._id, req.body);
    return sendSuccess(res, scenario, 'Comparison saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

const deleteComparison = async (req, res, next) => {
  try {
    const { id } = req.params;
    await comparisonService.deleteComparison(req.user._id, id);
    return sendSuccess(res, null, 'Saved comparison removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateComparison,
  getSavedComparisons,
  getComparisonById,
  saveComparison,
  deleteComparison,
};

