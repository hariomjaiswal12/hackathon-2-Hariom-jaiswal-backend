/**
 * jobController.js
 * Controller handling company job listings, career summary, refresh, and job detail endpoints.
 */

const jobService = require('../services/jobService');

/**
 * GET /api/v1/companies/:id/jobs
 * Query params: q, search, workArrangement, employmentType, department, dateRange, sortBy, page, limit
 */
exports.getCompanyJobs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      q,
      search,
      workArrangement,
      employmentType,
      department,
      dateRange,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = await jobService.getCompanyJobs(id, {
      search: q || search,
      workArrangement,
      employmentType,
      department,
      dateRange,
      sortBy,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/companies/:id/careers
 * Returns official careers portal details, verified status, and openings count
 */
exports.getCareersSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await jobService.getCareersSummary(id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/companies/:id/jobs/refresh
 * Triggers on-demand sync from connected ATS provider (rate-limited)
 */
exports.refreshCompanyJobs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';

    const result = await jobService.refreshCompanyJobs(id, force);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/jobs/:jobId
 * Retrieve detailed information for a single job opening
 */
exports.getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await jobService.getJobById(jobId);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

