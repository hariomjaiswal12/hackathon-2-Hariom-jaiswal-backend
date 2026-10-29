/**
 * jobService.js
 * Business logic for job requisitions, filtering, pagination, and real-time syncing.
 */

const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const jobDiscoveryService = require('./jobDiscoveryService');
const AppError = require('../utils/appError');

class JobService {
  constructor() {
    this.refreshCooldowns = new Map(); // slug -> timestamp
    this.COOLDOWN_MS = 60 * 1000; // 1 minute rate limit on refresh per company
  }

  /**
   * Helper to find company by ID or Slug
   */
  async resolveCompany(companyIdOrSlug) {
    if (!companyIdOrSlug) return null;

    const trimmed = companyIdOrSlug.toString().trim();
    let company = null;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      company = await Company.findById(trimmed);
    }
    if (!company) {
      company = await Company.findOne({ slug: trimmed.toLowerCase() });
    }
    if (!company) {
      company = await Company.findOne({
        $or: [
          { normalizedName: trimmed.toLowerCase() },
          { name: new RegExp(`^${trimmed}$`, 'i') },
          { aliases: trimmed },
          { domain: trimmed.toLowerCase() },
        ],
      });
    }

    // If company not found in DB but exists in known ATS Registry, provision on-demand
    if (!company && jobDiscoveryService.atsRegistry[trimmed.toLowerCase()]) {
      const reg = jobDiscoveryService.atsRegistry[trimmed.toLowerCase()];
      const name = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      const industryMap = {
        figma: 'Design Software & Collaboration',
        spotify: 'Audio Streaming & Entertainment',
        stripe: 'Financial Technology / Payments',
        cloudflare: 'Cloud Infrastructure & Security',
        reddit: 'Social Media & Online Communities',
      };
      company = await Company.create({
        name,
        slug: trimmed.toLowerCase(),
        domain: `${trimmed.toLowerCase()}.com`,
        website: `https://www.${trimmed.toLowerCase()}.com`,
        legalName: name,
        shortName: name,
        industry: industryMap[trimmed.toLowerCase()] || 'Technology & Software',
        workforce: {
          careersUrl: reg.portalUrl,
          atsProvider: reg.provider,
          atsToken: reg.token,
          openPositions: [],
        },
        isDemoData: false,
      }).then((doc) => doc.toObject()).catch(() => null);
    }

    return company;
  }

  /**
   * Get paginated, filtered genuine jobs for a company
   */
  async getCompanyJobs(companyIdOrSlug, options = {}) {
    const company = await this.resolveCompany(companyIdOrSlug);
    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const {
      search = '',
      workArrangement = '',
      employmentType = '',
      department = '',
      dateRange = 'all', // '24h', '7d', '30d', 'all'
      status = 'ACTIVE',
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = options;

    // Check if we need initial synchronization (if company has ATS feed and 0 jobs in DB)
    const existingCount = await Job.countDocuments({ companySlug: company.slug });
    const atsConfig = jobDiscoveryService.resolveAtsConfig(company);

    if (existingCount === 0 && atsConfig.provider !== 'COMPANY_PORTAL') {
      try {
        await jobDiscoveryService.syncCompanyJobs(company);
      } catch (syncErr) {
        console.warn(`[JobService] Initial job sync failed for ${company.slug}:`, syncErr.message);
      }
    }

    // Build query filter
    const query = {
      companySlug: company.slug,
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (workArrangement && workArrangement !== 'ALL') {
      query.workArrangement = workArrangement;
    }

    if (employmentType && employmentType !== 'ALL') {
      query.employmentType = employmentType;
    }

    if (department && department !== 'ALL') {
      query.department = new RegExp(`^${department.trim()}$`, 'i');
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === '24h') {
        query.postedAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (dateRange === '7d') {
        query.postedAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === '30d') {
        query.postedAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // Text search filter
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { department: regex },
        { skills: regex },
        { location: regex },
        { description: regex },
      ];
    }

    // Sorting options
    let sortObj = { postedAt: -1 };
    if (sortBy === 'oldest') {
      sortObj = { postedAt: 1 };
    } else if (sortBy === 'title') {
      sortObj = { title: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, totalFiltered, totalActive] = await Promise.all([
      Job.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Job.countDocuments(query),
      Job.countDocuments({ companySlug: company.slug, status: 'ACTIVE' }),
    ]);

    // Aggregate available filter options
    const allCompanyJobs = await Job.find({ companySlug: company.slug, status: 'ACTIVE' }, 'department workArrangement employmentType').lean();
    const departments = [...new Set(allCompanyJobs.map((j) => j.department).filter(Boolean))].sort();
    const workArrangements = [...new Set(allCompanyJobs.map((j) => j.workArrangement).filter(Boolean))].sort();
    const employmentTypes = [...new Set(allCompanyJobs.map((j) => j.employmentType).filter(Boolean))].sort();

    // Summary metadata
    const summary = await this.getCareersSummary(company);

    return {
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limitNum) || 1,
        hasMore: pageNum * limitNum < totalFiltered,
      },
      summary: {
        ...summary,
        totalActive,
        totalFiltered,
      },
      filterOptions: {
        departments,
        workArrangements,
        employmentTypes,
      },
    };
  }

  /**
   * Get careers portal summary & honest status for a company
   */
  async getCareersSummary(companyOrIdentifier) {
    const company = typeof companyOrIdentifier === 'string'
      ? await this.resolveCompany(companyOrIdentifier)
      : companyOrIdentifier;

    if (!company) {
      const err = new Error('Company not found');
      err.status = 404;
      err.code = 'COMPANY_NOT_FOUND';
      throw err;
    }

    const atsConfig = jobDiscoveryService.resolveAtsConfig(company);
    const totalActive = await Job.countDocuments({ companySlug: company.slug, status: 'ACTIVE' });
    const latestJob = await Job.findOne({ companySlug: company.slug }).sort({ lastVerifiedAt: -1 }).lean();

    const isVkaps = company.slug === 'vkaps-it-solutions' || company.name?.toLowerCase().includes('vkaps');
    const resolvedCareersUrl = isVkaps
      ? 'https://vkaps.com/contact'
      : (company.workforce?.careersUrl || atsConfig.portalUrl || (company.website ? `${company.website.replace(/\/$/, '')}/careers` : null));

    let statusNotice = null;
    if (isVkaps) {
      statusNotice = 'No verified active vacancies are currently indexed for VKAPS IT Solutions Private Limited through connected public ATS feeds. Direct job inquiries are accepted through their verified contact portal.';
    } else if (totalActive === 0 && atsConfig.provider === 'COMPANY_PORTAL') {
      statusNotice = `No public ATS requisitions are currently indexed for ${company.name}. Open positions and talent inquiries may be accessed via their official portal.`;
    }

    return {
      companySlug: company.slug,
      companyName: company.name,
      careersUrl: resolvedCareersUrl,
      sourceProvider: atsConfig.provider,
      hasLiveFeed: atsConfig.provider !== 'COMPANY_PORTAL' && totalActive > 0,
      totalActiveJobs: totalActive,
      lastVerifiedAt: latestJob?.lastVerifiedAt || new Date(),
      statusNotice,
      isVerifiedPortal: true,
    };
  }

  /**
   * Trigger on-demand sync from external ATS provider (rate-limited)
   */
  async refreshCompanyJobs(companyIdOrSlug, force = false) {
    const company = await this.resolveCompany(companyIdOrSlug);
    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const lastRefresh = this.refreshCooldowns.get(company.slug);
    const now = Date.now();

    if (!force && lastRefresh && (now - lastRefresh) < this.COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((this.COOLDOWN_MS - (now - lastRefresh)) / 1000);
      return {
        refreshed: false,
        rateLimited: true,
        message: `Listings were recently updated. Next refresh available in ${remainingSeconds}s.`,
        summary: await this.getCareersSummary(company),
      };
    }

    const syncResult = await jobDiscoveryService.syncCompanyJobs(company);
    this.refreshCooldowns.set(company.slug, now);

    return {
      refreshed: true,
      rateLimited: false,
      syncResult,
      summary: await this.getCareersSummary(company),
    };
  }

  /**
   * Retrieve single job by ID
   */
  async getJobById(jobId) {
    if (!jobId) {
      throw new AppError('Job ID is required', 400, 'BAD_REQUEST');
    }

    let job = null;
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      job = await Job.findById(jobId).lean();
    }
    if (!job) {
      job = await Job.findOne({ externalJobId: jobId }).lean();
    }

    if (!job) {
      throw new AppError('Job listing not found', 404, 'JOB_NOT_FOUND');
    }

    return job;
  }
}

module.exports = new JobService();
