/**
 * jobDiscoveryService.js
 * Multi-provider job discovery engine supporting Greenhouse, Lever, and verified direct portals.
 */

const GreenhouseJobProvider = require('./providers/GreenhouseJobProvider');
const LeverJobProvider = require('./providers/LeverJobProvider');
const DirectPortalJobProvider = require('./providers/DirectPortalJobProvider');
const Job = require('../models/Job');

class JobDiscoveryService {
  constructor() {
    this.greenhouseProvider = new GreenhouseJobProvider();
    this.leverProvider = new LeverJobProvider();
    this.directPortalProvider = new DirectPortalJobProvider();

    // Known ATS tokens registry for major tech companies
    this.atsRegistry = {
      'figma': { provider: 'GREENHOUSE', token: 'figma', portalUrl: 'https://boards.greenhouse.io/figma' },
      'stripe': { provider: 'GREENHOUSE', token: 'stripe', portalUrl: 'https://boards.greenhouse.io/stripe' },
      'github': { provider: 'GREENHOUSE', token: 'github', portalUrl: 'https://boards.greenhouse.io/github' },
      'cloudflare': { provider: 'GREENHOUSE', token: 'cloudflare', portalUrl: 'https://boards.greenhouse.io/cloudflare' },
      'reddit': { provider: 'GREENHOUSE', token: 'reddit', portalUrl: 'https://boards.greenhouse.io/reddit' },
      'hotjar': { provider: 'GREENHOUSE', token: 'hotjar', portalUrl: 'https://boards.greenhouse.io/hotjar' },
      'airbnb': { provider: 'GREENHOUSE', token: 'airbnb', portalUrl: 'https://careers.airbnb.com' },
      'spotify': { provider: 'LEVER', token: 'spotify', portalUrl: 'https://jobs.lever.co/spotify' },
      'hootsuite': { provider: 'LEVER', token: 'hootsuite', portalUrl: 'https://jobs.lever.co/hootsuite' },
      'netflix': { provider: 'LEVER', token: 'netflix', portalUrl: 'https://jobs.lever.co/netflix' },
      'vkaps-it-solutions': { provider: 'COMPANY_PORTAL', token: null, portalUrl: 'https://vkaps.com/contact' },
    };
  }

  /**
   * Determine ATS configuration for a company
   * @param {Object} company
   */
  resolveAtsConfig(company = {}) {
    const slug = (company.slug || '').toLowerCase().trim();

    // Explicit DB override
    if (company.workforce?.atsProvider && company.workforce?.atsToken) {
      return {
        provider: company.workforce.atsProvider.toUpperCase(),
        token: company.workforce.atsToken,
        portalUrl: company.workforce.careersUrl,
      };
    }

    // Direct registry match
    if (this.atsRegistry[slug]) {
      return this.atsRegistry[slug];
    }

    // Check by name heuristics
    const name = (company.name || '').toLowerCase();
    for (const [key, config] of Object.entries(this.atsRegistry)) {
      if (name === key || name.startsWith(`${key} `) || name.includes(key)) {
        return config;
      }
    }

    // Default fallback to direct portal
    return {
      provider: 'COMPANY_PORTAL',
      token: null,
      portalUrl: this.directPortalProvider.resolvePortalUrl(company),
    };
  }

  /**
   * Fetch live jobs using the detected provider
   * @param {Object} company
   */
  async fetchLiveJobs(company) {
    const config = this.resolveAtsConfig(company);
    const companyContext = {
      id: company._id,
      name: company.name,
      slug: company.slug,
    };

    if (config.provider === 'GREENHOUSE' && config.token) {
      try {
        const res = await this.greenhouseProvider.fetchJobs(config.token, companyContext);
        if (res.boardFound) {
          return {
            ...res,
            provider: 'GREENHOUSE',
            atsToken: config.token,
          };
        }
      } catch (err) {
        console.warn(`[JobDiscovery] Greenhouse fetch failed for ${company.slug}:`, err.message);
      }
    }

    if (config.provider === 'LEVER' && config.token) {
      try {
        const res = await this.leverProvider.fetchJobs(config.token, companyContext);
        if (res.boardFound) {
          return {
            ...res,
            provider: 'LEVER',
            atsToken: config.token,
          };
        }
      } catch (err) {
        console.warn(`[JobDiscovery] Lever fetch failed for ${company.slug}:`, err.message);
      }
    }

    // Direct portal / no live ATS feed
    const portalStatus = await this.directPortalProvider.getPortalStatus(company);
    return {
      ...portalStatus,
      provider: 'COMPANY_PORTAL',
      atsToken: null,
    };
  }

  /**
   * Synchronize jobs from provider into MongoDB Job collection
   * @param {Object} company
   */
  async syncCompanyJobs(company) {
    const liveResult = await this.fetchLiveJobs(company);
    const incomingJobs = liveResult.jobs || [];

    const activeExternalIds = [];

    // Bulk upsert incoming active jobs
    for (const jobData of incomingJobs) {
      activeExternalIds.push(jobData.externalJobId);

      await Job.findOneAndUpdate(
        { companySlug: company.slug, externalJobId: jobData.externalJobId },
        {
          $set: {
            title: jobData.title,
            companyId: company._id,
            companySlug: company.slug,
            companyName: company.name,
            description: jobData.description,
            responsibilities: jobData.responsibilities,
            skills: jobData.skills,
            experienceRange: jobData.experienceRange,
            employmentType: jobData.employmentType,
            workArrangement: jobData.workArrangement,
            location: jobData.location,
            city: jobData.city,
            country: jobData.country,
            department: jobData.department,
            salary: jobData.salary,
            postedAt: jobData.postedAt,
            applyUrl: jobData.applyUrl,
            originalUrl: jobData.originalUrl,
            sourceProvider: jobData.sourceProvider,
            status: 'ACTIVE',
            lastVerifiedAt: new Date(),
            isVerified: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Mark previous jobs from this provider that are no longer listed as CLOSED
    if (incomingJobs.length > 0) {
      await Job.updateMany(
        {
          companySlug: company.slug,
          sourceProvider: liveResult.provider,
          externalJobId: { $nin: activeExternalIds },
          status: 'ACTIVE',
        },
        {
          $set: {
            status: 'CLOSED',
            lastVerifiedAt: new Date(),
          },
        }
      );
    }

    return {
      provider: liveResult.provider,
      totalSynced: incomingJobs.length,
      careersUrl: liveResult.careersUrl || company.workforce?.careersUrl,
      lastVerifiedAt: new Date(),
      statusNotice: liveResult.statusNotice || null,
      hasLiveFeed: liveResult.hasLiveFeed !== false && incomingJobs.length > 0,
    };
  }
}

module.exports = new JobDiscoveryService();

