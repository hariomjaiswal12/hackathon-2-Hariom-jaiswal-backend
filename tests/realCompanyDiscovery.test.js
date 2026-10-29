const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const CompanySubmission = require('../src/models/CompanySubmission');

jest.setTimeout(30000);

describe('Real Company & Startup Discovery Integration Tests', () => {
  let adminToken = '';
  let userToken = '';
  let adminUser;
  let normalUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Ensure an admin user exists and get token
    const adminEmail = `admin_test_${Date.now()}@example.com`;
    const adminPassword = 'AdminPassword123!';
    const adminHash = await User.hashPassword(adminPassword);
    adminUser = await User.create({
      name: 'Test Administrator',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
      careerStage: '3+ years',
      targetRole: 'Data Architect',
    });

    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });
    adminToken = adminLoginRes.body.data.tokens.accessToken;

    // Normal user
    const userEmail = `user_test_${Date.now()}@example.com`;
    const userPassword = 'UserPassword123!';
    const userHash = await User.hashPassword(userPassword);
    normalUser = await User.create({
      name: 'Standard User',
      email: userEmail,
      passwordHash: userHash,
      role: 'user',
      careerStage: 'Fresher',
      targetRole: 'Software Engineer',
    });

    const userLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: userEmail,
      password: userPassword,
    });
    userToken = userLoginRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (normalUser) await User.findByIdAndDelete(normalUser._id);
    await mongoose.disconnect();
  });

  // --- 1. VKAPS IT SOLUTIONS DISCOVERY & VERIFICATION ---
  describe('VKAPS IT Solutions Pvt. Ltd. Search & Verification', () => {
    it('should search and find VKAPS by exact short name', async () => {
      const res = await request(app).get('/api/v1/companies?search=VKAPS');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.length).toBeGreaterThan(0);

      const vkaps = res.body.data.companies.find((c) => c.slug === 'vkaps-it-solutions' || c.name.includes('VKAPS'));
      expect(vkaps).toBeDefined();
      expect(vkaps.name).toBe('VKAPS IT Solutions Private Limited');
      expect(vkaps.registrationNumber).toBe('U72900MP2018PTC047186');
      expect(vkaps.jurisdiction).toContain('ROC Gwalior');
      expect(vkaps.domain).toBe('vkaps.com');
      expect(vkaps.verificationStatus).toBe('OFFICIAL_REGISTRY');
      expect(vkaps.overallScore).toBeDefined();
      expect(vkaps.reviewCount).toBeGreaterThanOrEqual(0);
    });

    it('should find VKAPS by case-insensitive name and suffix variation "VKAPS IT Solutions Pvt Ltd"', async () => {
      const res = await request(app).get('/api/v1/companies?search=vkaps it solutions pvt ltd');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const vkaps = res.body.data.companies.find((c) => c.slug === 'vkaps-it-solutions' || c.id === 'vkaps-it-solutions');
      expect(vkaps).toBeDefined();
    });

    it('should find VKAPS by official Corporate Identification Number (CIN)', async () => {
      const res = await request(app).get('/api/v1/companies?search=U72900MP2018PTC047186');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.companies[0].id).toBe('vkaps-it-solutions');
    });

    it('should retrieve full verified details of VKAPS by slug', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('vkaps-it-solutions');
      expect(res.body.data.headquarters).toContain('Indore');
      expect(res.body.data.city).toBe('Indore');
      expect(res.body.data.country).toBe('India');
      expect(res.body.data.isStartup).toBe(true);
      expect(res.body.data.dataSources.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.dataSources[0].provider).toContain('Ministry of Corporate Affairs');
      expect(res.body.data.overallScore).toBeDefined();
    });
  });

  // --- 2. AUTOCOMPLETE SUGGESTIONS ENDPOINT ---
  describe('GET /api/v1/companies/suggestions', () => {
    it('should return fast autocomplete suggestions for partial query "vkap"', async () => {
      const res = await request(app).get('/api/v1/companies/suggestions?q=vkap');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
      expect(res.body.data.suggestions.length).toBeGreaterThan(0);

      const item = res.body.data.suggestions[0];
      expect(item.id).toBe('vkaps-it-solutions');
      expect(item.name).toContain('VKAPS');
      expect(item.domain).toBe('vkaps.com');
      expect(item.verificationStatus).toBe('OFFICIAL_REGISTRY');
    });

    it('should return suggestions for global enterprise "micro"', async () => {
      const res = await request(app).get('/api/v1/companies/suggestions?q=micro');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const match = res.body.data.suggestions.find((s) => s.name.toLowerCase().includes('microsoft'));
      expect(match).toBeDefined();
    });
  });

  // --- 3. GLOBAL & INDIAN REAL DISCOVERY ---
  describe('Global & Indian Enterprise Search', () => {
    it('should search for TCS and match official records with suffix tolerance', async () => {
      const res = await request(app).get('/api/v1/companies?search=Tata Consultancy Services Limited');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const tcs = res.body.data.companies.find((c) => c.slug === 'tcs' || c.id === 'tcs');
      expect(tcs).toBeDefined();
    });

    it('should search for Infosys with legal suffix variation "Infosys Ltd"', async () => {
      const res = await request(app).get('/api/v1/companies?search=Infosys Ltd');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const infy = res.body.data.companies.find((c) => c.slug === 'infosys' || c.id === 'infosys');
      expect(infy).toBeDefined();
    });

    it('should return empty results without crash when searching nonexistent nonsense string', async () => {
      const res = await request(app).get('/api/v1/companies?search=zzxxyy_nonexistent_corp_9999');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.companies.length).toBe(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // --- 4. COMPANY SUBMISSION WORKFLOW ---
  describe('Company Submission & Admin Verification Workflow', () => {
    let createdSubmissionId = '';

    it('should allow submitting a new company for verification', async () => {
      const submissionData = {
        name: 'Apex AI Labs',
        legalName: 'Apex AI Technologies Private Limited',
        registrationNumber: 'U72900DL2024PTC998877',
        jurisdiction: 'India / ROC Delhi',
        country: 'India',
        city: 'New Delhi',
        headquarters: 'Connaught Place, New Delhi, India',
        website: 'https://apexailabs.dev',
        industry: 'Artificial Intelligence & Machine Learning',
        description: 'Developer of enterprise machine learning workflows and synthetic intelligence.',
        foundedYear: 2024,
        officialEmail: 'contact@apexailabs.dev',
        evidenceNotes: 'Registered with ROC Delhi under CIN U72900DL2024PTC998877.',
      };

      const res = await request(app)
        .post('/api/v1/companies/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send(submissionData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(submissionData.name);
      expect(res.body.data.status).toBe('pending');
      createdSubmissionId = res.body.data.id;
    });

    it('should reject non-admin access to admin submission list', async () => {
      const res = await request(app)
        .get('/api/v1/companies/admin/submissions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to view pending submissions', async () => {
      const res = await request(app)
        .get('/api/v1/companies/admin/submissions?status=pending')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissions.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow admin to approve and verify submission into Company collection', async () => {
      const res = await request(app)
        .patch(`/api/v1/companies/admin/submissions/${createdSubmissionId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          notes: 'CIN verified against ROC Delhi public registry.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');

      // Now verify company is searchable in CompanyIQ
      const searchRes = await request(app).get('/api/v1/companies?search=Apex AI Labs');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.companies.length).toBeGreaterThan(0);
      const approvedComp = searchRes.body.data.companies[0];
      expect(approvedComp.name).toBe('Apex AI Labs');
      expect(approvedComp.verificationStatus).toBe('ADMIN_VERIFIED');
      expect(approvedComp.overallScore).toBeNull(); // No invented score!

      // Cleanup created company and submission
      await Company.deleteOne({ registrationNumber: 'U72900DL2024PTC998877' });
      await CompanySubmission.findByIdAndDelete(createdSubmissionId);
    });
  });

  describe('Comprehensive Company Intelligence Profile (12 Sections)', () => {
    it('should retrieve full verified profile for VKAPS IT Solutions across all intelligence sections', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const comp = res.body.data;

      // 1. Identity & Registration
      expect(comp.name).toBe('VKAPS IT Solutions Private Limited');
      expect(comp.legalName).toBe('VKAPS IT SOLUTIONS PRIVATE LIMITED');
      expect(comp.registrationNumber).toBe('U72900MP2018PTC047186');
      expect(comp.jurisdiction).toContain('ROC Gwalior');
      expect(comp.legalStatus).toBe('Active');
      expect(comp.entityType).toContain('Private Limited');
      expect(comp.foundedYear).toBe(2011);
      expect(comp.headquarters).toContain('8/1 Roshan Singh Bhandari Marg');
      expect(comp.website).toMatch(/^https:\/\/vkaps\.com\/?$/);

      // 2. Leadership
      expect(Array.isArray(comp.leadership)).toBe(true);
      expect(comp.leadership.length).toBeGreaterThanOrEqual(1);
      expect(comp.leadership.some(l => l.name === 'Vinod Mahajan')).toBe(true);
      expect(comp.leadership.some(l => l.name === 'Vipin Kaushik')).toBe(true);

      // 3. Financials (Explicitly non-public, undisclosed with MCA authorized capital)
      expect(comp.financials).toBeDefined();
      expect(comp.financials.isPublic).toBe(false);
      expect(comp.financials.authorizedCapital).toContain('₹1,00,000');
      expect(comp.financials.paidUpCapital).toContain('₹1,00,000');
      expect(comp.financials.statusDescription).toContain('Privately Held');

      // 4. Products & Services & Tech Stack
      expect(comp.services.length).toBeGreaterThanOrEqual(3);
      expect(comp.techStack).toContain('Node.js');
      expect(comp.techStack).toContain('Python');
      expect(comp.techStack).toContain('React');

      // 5. Workforce & Careers
      expect(comp.workforce).toBeDefined();
      expect(['https://vkaps.com/careers', 'https://vkaps.com/contact']).toContain(comp.workforce.careersUrl);
      expect(Array.isArray(comp.workforce.openPositions)).toBe(true);
      expect(comp.workforce.internshipOpportunities).toBeDefined();

      // 6. Reputation & Milestones & Competitors
      expect(comp.reputation?.ratings?.length).toBeGreaterThanOrEqual(1);
      expect(comp.milestones?.length).toBeGreaterThanOrEqual(3);
      expect(comp.competitors?.length).toBeGreaterThanOrEqual(2);

      // 7. Grounded Intelligence & Categories
      expect(comp.overallScore).toBe(85);
      expect(comp.categories.learning.score).toBe(88);
      expect(comp.categories.growth.score).toBe(85);
      expect(comp.categories.stability.score).toBe(84);
      expect(comp.categories.wlb.score).toBe(82);

      // 8. Career Fit (Zero-hallucination: Insufficient Role Evidence when no published requisitions exist for target role)
      expect(comp.careerFit).toBeDefined();
      expect(comp.careerFit.hasRoleEvidence).toBe(false);
      expect(comp.careerFit.tier).toBe('Insufficient Role Evidence');
      expect(comp.careerFit.fitScore).toBeNull();
    });

    it('should retrieve full verified profile for flagship enterprise (TCS) with public market financials', async () => {
      const res = await request(app).get('/api/v1/companies/tcs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const comp = res.body.data;
      expect(comp.name).toContain('Tata Consultancy Services');
      expect(comp.financials.isPublic).toBe(true);
      expect(comp.financials.ticker).toContain('NSE: TCS');
      expect(comp.financials.revenue).toContain('₹240,893');
      expect(comp.leadership[0].name).toContain('Krithivasan');
      expect(comp.workforce.careersUrl).toBe('https://www.tcs.com/careers');
    });
  });
});
