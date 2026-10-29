const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');

describe('Real-Time Hiring & Direct Job Applications Tests', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // 1. VKAPS IT Solutions - Zero Hallucination & Honest Careers Portal
  describe('VKAPS IT Solutions Careers & Requisitions', () => {
    it('should return honest careers summary for VKAPS with official contact portal', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions/careers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companySlug).toBe('vkaps-it-solutions');
      expect(res.body.data.careersUrl).toBe('https://vkaps.com/contact');
      expect(res.body.data.totalActiveJobs).toBe(0);
      expect(res.body.data.hasLiveFeed).toBe(false);
      expect(res.body.data.statusNotice).toMatch(/No verified active vacancies/i);
    });

    it('should return 0 fake jobs for VKAPS (strict zero hallucination)', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions/jobs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
      expect(res.body.data.summary.statusNotice).toMatch(/No verified active vacancies/i);
    });

    it('should confirm VKAPS company document has zero fake openPositions', async () => {
      const vkaps = await Company.findOne({ slug: 'vkaps-it-solutions' }).lean();
      expect(vkaps).toBeDefined();
      expect(vkaps.workforce.openPositions).toHaveLength(0);
      expect(vkaps.workforce.careersUrl).toBe('https://vkaps.com/contact');
    });
  });

  // 2. Real Live ATS Companies (Figma, Spotify, Stripe)
  describe('ATS-Connected Companies Job Listings', () => {
    it('should return verified live jobs from Greenhouse for Figma', async () => {
      const res = await request(app).get('/api/v1/companies/figma/jobs?limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBeGreaterThan(0);
      expect(res.body.data.summary.sourceProvider).toBe('GREENHOUSE');
      expect(res.body.data.summary.careersUrl).toBe('https://boards.greenhouse.io/figma');

      // Check job schema fields
      const sampleJob = res.body.data.jobs[0];
      expect(sampleJob.title).toBeDefined();
      expect(sampleJob.applyUrl).toMatch(/^https:\/\/(boards\.greenhouse\.io|figma\.com)/);
      expect(sampleJob.isVerified).toBe(true);
      expect(sampleJob.status).toBe('ACTIVE');
      expect(sampleJob.externalJobId).toMatch(/^greenhouse-/);
    }, 25000);

    it('should return verified live jobs from Lever for Spotify with salary disclosure', async () => {
      const res = await request(app).get('/api/v1/companies/spotify/jobs?limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBeGreaterThan(0);
      expect(res.body.data.summary.sourceProvider).toBe('LEVER');
      expect(res.body.data.summary.careersUrl).toBe('https://jobs.lever.co/spotify');

      const sampleJob = res.body.data.jobs[0];
      expect(sampleJob.title).toBeDefined();
      expect(sampleJob.applyUrl).toMatch(/^https:\/\/jobs\.lever\.co\/spotify/);
      expect(sampleJob.externalJobId).toMatch(/^lever-/);
    }, 25000);

    it('should filter jobs by keyword search', async () => {
      const res = await request(app).get('/api/v1/companies/figma/jobs?search=Engineer');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.jobs.forEach((job) => {
        const matchesTitle = job.title.toLowerCase().includes('engineer');
        const matchesDesc = job.description.toLowerCase().includes('engineer');
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes('engineer'));
        expect(matchesTitle || matchesDesc || matchesSkills).toBe(true);
      });
    });

    it('should filter jobs by work arrangement', async () => {
      const res = await request(app).get('/api/v1/companies/figma/jobs?workArrangement=Hybrid');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.jobs.forEach((job) => {
        expect(job.workArrangement).toBe('Hybrid');
      });
    });

    it('should support pagination correctly', async () => {
      const page1 = await request(app).get('/api/v1/companies/figma/jobs?page=1&limit=5');
      const page2 = await request(app).get('/api/v1/companies/figma/jobs?page=2&limit=5');

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.data.jobs).toHaveLength(5);
      expect(page2.body.data.jobs).toHaveLength(5);

      const page1Ids = page1.body.data.jobs.map((j) => j._id);
      const page2Ids = page2.body.data.jobs.map((j) => j._id);

      // Verify no duplicate IDs across pages
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  // 3. Rate-limited Refresh Endpoint
  describe('POST /api/v1/companies/:id/jobs/refresh', () => {
    it('should rate-limit rapid successive refresh calls', async () => {
      // First refresh
      const res1 = await request(app).post('/api/v1/companies/figma/jobs/refresh?force=true');
      expect(res1.status).toBe(200);

      // Immediate second refresh without force
      const res2 = await request(app).post('/api/v1/companies/figma/jobs/refresh');
      expect(res2.status).toBe(200);
      expect(res2.body.data.rateLimited).toBe(true);
      expect(res2.body.data.message).toMatch(/recently updated/i);
    }, 25000);
  });

  // 4. Single Job Endpoint
  describe('GET /api/v1/jobs/:jobId', () => {
    it('should retrieve a single job by its MongoDB ObjectId', async () => {
      const jobInDb = await Job.findOne({ companySlug: 'figma' });
      expect(jobInDb).toBeDefined();

      const res = await request(app).get(`/api/v1/jobs/${jobInDb._id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(jobInDb.title);
      expect(res.body.data.applyUrl).toBe(jobInDb.applyUrl);
    });

    it('should return 404 for an invalid/nonexistent jobId', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/jobs/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
