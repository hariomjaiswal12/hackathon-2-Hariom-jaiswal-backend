const companyService = require('../services/companyService');
const CareerDNA = require('../models/CareerDNA');
const SavedCompany = require('../models/SavedCompany');
const ResearchHistory = require('../models/ResearchHistory');
const { sendSuccess } = require('../utils/apiResponse');

const getCompanies = async (req, res, next) => {
  try {
    let userPriorities = null;
    let savedCompanyIds = [];

    if (req.user) {
      const dna = await CareerDNA.findOne({ userId: req.user._id }).lean();
      if (dna) {
        userPriorities = dna.priorities;
      }
      const saved = await SavedCompany.find({ userId: req.user._id }).lean();
      savedCompanyIds = saved.map((s) => s.companySlug);
    }

    const result = await companyService.getCompanies({
      ...req.query,
      userPriorities,
      savedCompanyIds,
    });

    return sendSuccess(res, result, 'Companies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSuggestions = async (req, res, next) => {
  try {
    const { q = '', limit = 6 } = req.query;
    const result = await companyService.getSuggestions(q, parseInt(limit, 10));
    return sendSuccess(res, result, 'Company suggestions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let userPriorities = null;
    let isSaved = false;

    if (req.user) {
      const dna = await CareerDNA.findOne({ userId: req.user._id }).lean();
      if (dna) {
        userPriorities = dna.priorities;
      }
      const saved = await SavedCompany.findOne({
        userId: req.user._id,
        $or: [{ companySlug: id.toLowerCase() }],
      }).lean();
      isSaved = !!saved;

      // Track research history for logged in user (fire and forget)
      ResearchHistory.create({
        userId: req.user._id,
        activity: id.toUpperCase(),
        type: 'Company',
        context: 'Company intelligence viewed',
        companySlug: id.toLowerCase(),
        link: `/company/${id}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateGroup: 'TODAY / OCT 28, 2026',
      }).catch(() => {});
    }

    try {
      const company = await companyService.getCompanyByIdOrSlug(id, userPriorities, isSaved);
      return sendSuccess(res, company, 'Company details retrieved successfully');
    } catch (lookupErr) {
      if (lookupErr.statusCode === 404 || lookupErr.status === 404) {
        // Fallback support for alias: GET /api/v1/companies/:jobId
        const Job = require('../models/Job');
        const mongoose = require('mongoose');
        let job = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          job = await Job.findById(id).lean();
        }
        if (!job) {
          job = await Job.findOne({ externalJobId: id }).lean();
        }
        if (job) {
          return sendSuccess(res, job, 'Job details retrieved successfully');
        }
      }
      throw lookupErr;
    }
  } catch (error) {
    next(error);
  }
};

const getEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryKey = 'learning' } = req.query;

    if (req.user) {
      ResearchHistory.create({
        userId: req.user._id,
        activity: `${id.toUpperCase()} · ${categoryKey}`,
        type: 'Evidence',
        context: `${categoryKey} evidence viewed`,
        companySlug: id.toLowerCase(),
        link: `/company/${id}/category/${categoryKey}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateGroup: 'TODAY / OCT 28, 2026',
      }).catch(() => {});
    }

    const evidence = await companyService.getEvidence(id, categoryKey);
    return sendSuccess(res, evidence, 'Evidence retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSources = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sources = await companyService.getSources(id);
    return sendSuccess(res, sources, 'Sources retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getReviewInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const insights = await companyService.getReviewInsights(id);
    return sendSuccess(res, insights, 'Review insights retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// --- Submission Workflow Controllers ---
const submitCompany = async (req, res, next) => {
  try {
    const submission = await companyService.submitCompany(req.body, req.user || null);
    return sendSuccess(
      res,
      submission,
      'Company submitted successfully for official verification',
      201
    );
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const result = await companyService.getSubmissions(req.query);
    return sendSuccess(res, result, 'Submissions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const verifySubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await companyService.verifySubmission(id, req.body, req.user);
    return sendSuccess(res, result, `Company submission ${req.body.status} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getSuggestions,
  getCompanyById,
  getEvidence,
  getSources,
  getReviewInsights,
  submitCompany,
  getSubmissions,
  verifySubmission,
};
