const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const CareerDNA = require('../src/models/CareerDNA');
const ComparisonScenario = require('../src/models/ComparisonScenario');

describe('Dynamic What-If Simulator Integration Tests', () => {
  let authToken = '';
  let testUser = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Register / login a test user
    const email = `whatif_test_${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/v1/auth/register').send({
      name: 'What-If Tester',
      email,
      password: 'Password123!',
      careerStage: 'Fresher',
      targetRole: 'Backend Developer',
    });

    if (regRes.status === 201) {
      authToken = regRes.body.data.tokens.accessToken;
      testUser = regRes.body.data.user;
    } else {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email,
        password: 'Password123!',
      });
      authToken = loginRes.body.data.tokens.accessToken;
      testUser = loginRes.body.data.user;
    }
  });

  afterAll(async () => {
    if (testUser) {
      await User.deleteOne({ _id: testUser.id }).catch(() => {});
      await CareerDNA.deleteOne({ userId: testUser.id }).catch(() => {});
      await ComparisonScenario.deleteMany({ userId: testUser.id }).catch(() => {});
    }
    await mongoose.disconnect();
  });

  const baselinePriorities = {
    learning: 95,
    growth: 90,
    stability: 85,
    culture: 80,
    wlb: 75,
    salary: 70,
    technology: 90,
    location: 60,
  };

  // Test Case 1: Dynamic comparison — TCS vs Infosys
  it('1. should calculate dynamic What-If comparison between TCS and Infosys', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['tcs', 'infosys'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(2);
    expect(res.body.data.baselineRankings).toHaveLength(2);

    const companySlugs = res.body.data.scenarioRankings.map((r) => r.companyId);
    expect(companySlugs).toContain('tcs');
    expect(companySlugs).toContain('infosys');

    // At baseline, TCS (87) ranks higher than Infosys (83)
    const tcs = res.body.data.scenarioRankings.find((r) => r.companyId === 'tcs');
    const infy = res.body.data.scenarioRankings.find((r) => r.companyId === 'infosys');
    expect(tcs.score).toBe(87);
    expect(infy.score).toBe(83);
    expect(tcs.rank).toBe(1);
    expect(infy.rank).toBe(2);
  });

  // Test Case 2: NVIDIA vs Microsoft
  it('2. should simulate NVIDIA vs Microsoft with dynamic priorities', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['nvidia', 'microsoft'],
        priorities: {
          ...baselinePriorities,
          learning: 95,
          growth: 90,
          wlb: 85,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(2);

    const nvidia = res.body.data.scenarioRankings.find((r) => r.companyId === 'nvidia');
    const msft = res.body.data.scenarioRankings.find((r) => r.companyId === 'microsoft');
    expect(nvidia).toBeDefined();
    expect(msft).toBeDefined();
    expect(nvidia.hasSufficientData).toBe(true);
    expect(msft.hasSufficientData).toBe(true);
    expect(typeof nvidia.score).toBe('number');
    expect(typeof msft.score).toBe('number');
  });

  // Test Case 3: VKAPS IT Solutions vs TCS
  it('3. should simulate VKAPS IT Solutions vs TCS accurately', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['vkaps-it-solutions', 'tcs'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(2);

    const vkaps = res.body.data.scenarioRankings.find((r) => r.companyId === 'vkaps-it-solutions');
    const tcs = res.body.data.scenarioRankings.find((r) => r.companyId === 'tcs');
    expect(vkaps).toBeDefined();
    expect(tcs).toBeDefined();
    expect(vkaps.hasSufficientData).toBe(true);
    expect(vkaps.score).toBeGreaterThan(0);
    expect(vkaps.breakdown).toBeDefined();
    expect(vkaps.breakdown.length).toBeGreaterThan(0);
  });

  // Test Case 4: 3 companies from different industries
  it('4. should simulate 3 companies from different industries (Google, VKAPS, Apple)', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['google', 'vkaps-it-solutions', 'apple'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(3);

    res.body.data.scenarioRankings.forEach((r, idx) => {
      expect(r.rank).toBe(idx + 1);
      expect(r.score).toBeGreaterThan(0);
      expect(r.hasSufficientData).toBe(true);
    });
  });

  // Test Case 5: 4 or more selected companies (e.g. 10 companies)
  it('5. should support simulating 10 companies with consistent ranks and delta calculations', async () => {
    const selectedIds = [
      'accenture',
      'tcs',
      'infosys',
      'microsoft',
      'google',
      'amazon',
      'nvidia',
      'apple',
      'adobe',
      'salesforce',
    ];

    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: selectedIds,
        priorities: {
          ...baselinePriorities,
          wlb: 100, // Shift WLB
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(10);
    expect(res.body.data.baselineRankings).toHaveLength(10);
    expect(res.body.data.delta).toHaveLength(10);

    // Delta entries must include deltas and scoreDiff
    res.body.data.delta.forEach((d) => {
      expect(d.companyId).toBeDefined();
      expect(typeof d.scenarioScore).toBe('number');
      expect(typeof d.scoreDiff).toBe('number');
      expect(typeof d.scenarioChange).toBe('string');
    });

    // Check rankings are sorted descending
    const scores = res.body.data.scenarioRankings.map((r) => r.score);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  // Test Case 6: Company with missing category evidence (e.g. registry company vanguard)
  it('6. should handle companies with insufficient evidence without crashing or fabricating 80', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['tcs', 'vanguard'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const vanguard = res.body.data.scenarioRankings.find((r) => r.companyId === 'vanguard');
    expect(vanguard).toBeDefined();
    expect(vanguard.score).toBeNull();
    expect(vanguard.hasSufficientData).toBe(false);
    expect(vanguard.tier).toBe('Insufficient Evidence');
    expect(vanguard.coverageNote).toBeDefined();

    // In delta, change is Insufficient data
    const vanguardDelta = res.body.data.delta.find((d) => d.companyId === 'vanguard');
    expect(vanguardDelta.scenarioChange).toBe('Insufficient data');
  });

  // Test Case 7: Unknown / invalid company ID
  it('7. should ignore unknown company IDs gracefully and calculate valid ones', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['unknown-corp-xyz-999', 'microsoft', 'google'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(2);
    const slugs = res.body.data.scenarioRankings.map((r) => r.companyId);
    expect(slugs).toEqual(expect.arrayContaining(['microsoft', 'google']));
    expect(slugs).not.toContain('unknown-corp-xyz-999');
  });

  // Test Case 8: Empty selection
  it('8. should return empty rankings gracefully when companyIds is empty', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: [],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scenarioRankings).toHaveLength(0);
    expect(res.body.data.baselineRankings).toHaveLength(0);
    expect(res.body.data.keyTakeaway).toContain('No companies selected');
  });

  // Test Case 9: Invalid priority weights
  it('9. should reject priority weights outside 0-100 range with 400', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['tcs', 'infosys'],
        priorities: {
          ...baselinePriorities,
          wlb: 150, // Invalid: > 100
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_PRIORITY_WEIGHT');
  });

  // Test Case 10: Resetting priorities preserves Career DNA and baseline calibrations
  it('10. should maintain exact baseline calibrations and keep Career DNA unmutated', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/calculate')
      .send({
        companyIds: ['accenture', 'tcs', 'infosys'],
        priorities: baselinePriorities,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.savedDNARemainsUnchanged).toBe(true);

    const acc = res.body.data.scenarioRankings.find((r) => r.companyId === 'accenture');
    const tcs = res.body.data.scenarioRankings.find((r) => r.companyId === 'tcs');
    const infy = res.body.data.scenarioRankings.find((r) => r.companyId === 'infosys');

    expect(acc.score).toBe(91);
    expect(tcs.score).toBe(87);
    expect(infy.score).toBe(83);
    expect(acc.rank).toBe(1);
    expect(tcs.rank).toBe(2);
    expect(infy.rank).toBe(3);
  });

  // Test Case 11: Save and reopen scenario with custom companyIds
  it('11. should save scenario with arbitrary companies and retrieve it successfully', async () => {
    const scenarioPayload = {
      title: 'Custom Multi-Company What-If',
      description: 'Testing NVIDIA, Microsoft, and VKAPS with WLB 95',
      companies: ['nvidia', 'microsoft', 'vkaps-it-solutions'],
      priorities: {
        ...baselinePriorities,
        wlb: 95,
      },
      isBaseline: false,
      scenarioType: 'whatif',
    };

    const saveRes = await request(app)
      .post('/api/v1/scenarios')
      .set('Authorization', `Bearer ${authToken}`)
      .send(scenarioPayload);

    expect(saveRes.status).toBe(201);
    expect(saveRes.body.success).toBe(true);
    expect(saveRes.body.data.id || saveRes.body.data._id).toBeDefined();
    expect(saveRes.body.data.companies).toEqual(expect.arrayContaining(['nvidia', 'microsoft', 'vkaps-it-solutions']));

    // Retrieve saved scenarios
    const getRes = await request(app)
      .get('/api/v1/scenarios')
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.length).toBeGreaterThan(0);

    const saved = getRes.body.data.find((s) => s.title === 'Custom Multi-Company What-If');
    expect(saved).toBeDefined();
    expect(saved.companies).toEqual(expect.arrayContaining(['nvidia', 'microsoft', 'vkaps-it-solutions']));
  });
});
