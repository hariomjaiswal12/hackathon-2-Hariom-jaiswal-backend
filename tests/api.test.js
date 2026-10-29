const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');

describe('CompanyIQ Backend Integration Tests', () => {
  let authToken = '';
  let testUserId = '';

  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // --- HEALTH CHECK ---
  describe('GET /api/v1/health', () => {
    it('should return healthy status and database connection info', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });
  });

  // --- AUTHENTICATION ---
  describe('Authentication Endpoints', () => {
    const testUser = {
      name: 'Test Engineer',
      email: `test_${Date.now()}@example.com`,
      password: 'Password123!',
      careerStage: 'Fresher',
      targetRole: 'Backend Developer',
    };

    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();

      authToken = res.body.data.tokens.accessToken;
      testUserId = res.body.data.user.id;
    });

    it('should reject registration with existing email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should login an existing user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    });
  });

  // --- COMPANIES & INTELLIGENCE ---
  describe('Company Intelligence Endpoints', () => {
    it('should list companies with pagination and filters', async () => {
      const res = await request(app).get('/api/v1/companies');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('should search companies by query', async () => {
      const res = await request(app).get('/api/v1/companies?query=TCS');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.some((c) => c.shortName === 'TCS')).toBe(true);
    });

    it('should retrieve company details by slug', async () => {
      const res = await request(app).get('/api/v1/companies/tcs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallScore).toBe(82);
      expect(res.body.data.categories.learning.score).toBe(91);
      expect(res.body.data.categories.learning.name).toBe('Learning Opportunities');
    });

    it('should retrieve evidence for a specific category', async () => {
      const res = await request(app).get('/api/v1/companies/tcs/evidence?categoryKey=learning');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categoryKey).toBe('learning');
      expect(res.body.data.status).toBe('SUPPORTED');
      expect(res.body.data.relevantMentions).toBe(86);
      expect(res.body.data.confidence.level).toBe('high');
    });

    it('should retrieve company sources', async () => {
      const res = await request(app).get('/api/v1/companies/tcs/sources');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should retrieve review insights for a company', async () => {
      const res = await request(app).get('/api/v1/companies/tcs/review-insights');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.commonPositiveThemes.length).toBeGreaterThan(0);
      expect(res.body.data.sentimentTrend.length).toBeGreaterThan(0);
    });
  });

  // --- CAREER DNA & CAREER FIT ---
  describe('Career DNA & Career Fit', () => {
    it('should get or auto-initialize Career DNA for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/career-dna')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.priorities.learning).toBe(95);
    });

    it('should update Career DNA priorities', async () => {
      const res = await request(app)
        .put('/api/v1/career-dna')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetRole: 'Backend Developer',
          experience: 'Fresher',
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
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.priorities.learning).toBe(95);
    });

    it('should calculate Career Fit across companies without mutating company intelligence', async () => {
      const res = await request(app)
        .get('/api/v1/career-fit')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matches.length).toBeGreaterThan(0);

      // Verify that company intelligence remained untouched
      const tcsRes = await request(app).get('/api/v1/companies/tcs');
      expect(tcsRes.body.data.overallScore).toBe(82);
    });
  });

  // --- COMPARISONS & WHAT-IF ---
  describe('Comparisons & What-If Simulator', () => {
    it('should compare 3 companies side-by-side', async () => {
      const res = await request(app)
        .post('/api/v1/comparisons/calculate')
        .send({
          companyIds: ['accenture', 'tcs', 'infosys'],
          scenario: 'baseline',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rankings.length).toBe(3);
      expect(res.body.data.leadCompany.id).toBe('accenture');
    });

    it('should reject comparison with fewer than 2 companies', async () => {
      const res = await request(app)
        .post('/api/v1/comparisons/calculate')
        .send({
          companyIds: ['tcs'],
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_COMPANY_COUNT');
    });

    it('should simulate What-If scenario (WLB 100) and elevate Infosys to #1 without altering saved DNA', async () => {
      const res = await request(app)
        .post('/api/v1/scenarios/calculate')
        .send({
          priorities: {
            learning: 95,
            growth: 90,
            stability: 85,
            culture: 80,
            wlb: 100, // Shift WLB to 100
            salary: 70,
            technology: 90,
            location: 60,
          },
          companyIds: ['accenture', 'tcs', 'infosys'],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scenarioRankings[0].companyId).toBe('infosys');
      expect(res.body.data.scenarioRankings[0].score).toBe(91);
      expect(res.body.data.savedDNARemainsUnchanged).toBe(true);
    });
  });

  // --- AI GROUNDED Q&A ---
  describe('Ask CompanyIQ Grounded AI', () => {
    it('should answer questions grounded strictly in company intelligence', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: 'tcs',
          question: 'Is TCS good for freshers?',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message.claim).toBeDefined();
      expect(res.body.data.message.confidence.level).toBe('high');
      expect(res.body.data.message.evidenceRef.mentions).toBe(86);
      expect(res.body.data.message.sources.length).toBeGreaterThan(0);
      expect(res.body.data.message.followUps.length).toBeGreaterThan(0);
    });
  });

  // --- SAVED RESEARCH & HISTORY ---
  describe('Saved Research & History', () => {
    it('should save a company to shortlist and prevent duplicates', async () => {
      const res = await request(app)
        .post('/api/v1/saved-companies/microsoft')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/v1/saved-companies')
        .set('Authorization', `Bearer ${authToken}`);
      expect(listRes.body.data.some((c) => c.id === 'microsoft')).toBe(true);
    });

    it('should remove a saved company', async () => {
      const res = await request(app)
        .delete('/api/v1/saved-companies/microsoft')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should retrieve research history', async () => {
      const res = await request(app)
        .get('/api/v1/history')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // --- DASHBOARD OVERVIEW ---
  describe('GET /api/v1/dashboard', () => {
    it('should return overview stats, recommended companies, and recent research', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.recommendedCompanies.length).toBe(3);
    });
  });

  // --- EXPANDED DATASET & MULTI-COMPANY INTEGRATION ---
  describe('Expanded Dataset & Multi-Company Integration', () => {
    it('should verify at least 25 distinct companies are accessible via API', async () => {
      const res = await request(app).get('/api/v1/companies?limit=100');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(25);
      expect(res.body.data.companies.length).toBeGreaterThanOrEqual(25);
    });

    it('should search and retrieve newly added companies (NVIDIA, Amazon, Wipro, Adobe, HCLTech)', async () => {
      const slugs = ['nvidia', 'amazon', 'wipro', 'adobe', 'hcltech'];
      for (const slug of slugs) {
        const res = await request(app).get(`/api/v1/companies/${slug}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(slug);
        expect(Object.keys(res.body.data.categories).length).toBe(8);
      }
    });

    it('should compare 3 expanded companies side-by-side', async () => {
      const res = await request(app)
        .post('/api/v1/comparisons/calculate')
        .send({ companyIds: ['nvidia', 'microsoft', 'apple'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.length).toBe(3);
      expect(res.body.data.rankings.length).toBe(3);
    });

    it('should run What-If simulations on expanded company cohorts', async () => {
      const res = await request(app)
        .post('/api/v1/scenarios/calculate')
        .send({
          companyIds: ['amazon', 'adobe', 'salesforce'],
          priorities: { learning: 80, growth: 80, stability: 80, culture: 90, wlb: 100, salary: 80, technology: 80, location: 60 },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scenarioRankings.length).toBe(3);
      expect(res.body.data.scenarioRankings[0].companyId).toBe('adobe');
    });
  });
});

