const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const Company = require('../src/models/Company');

describe('CompanyIQ Data Accuracy, Provenance & MCA Audit Tests', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('1. VKAPS IT Solutions Legal Entity Identity & Distinction', () => {
    it('should separate statutory incorporation date (2018-12-04) from brand founding year (2011)', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const comp = res.body.data;
      expect(comp.legalName).toBe('VKAPS IT SOLUTIONS PRIVATE LIMITED');
      expect(comp.brandName).toBe('VKAPS');
      expect(comp.registrationNumber).toBe('U72900MP2018PTC047186');
      expect(comp.jurisdiction).toMatch(/ROC Gwalior/i);
      expect(comp.foundedYear).toBe(2011);
      expect(comp.legalIncorporationDate).toMatch(/2018-12-04/);
      expect(comp.registeredAddress).toMatch(/Roshan Singh Bhandari Marg/i);
      expect(comp.operatingAddress).toMatch(/Indore/i);
      expect(comp.addressConflicts).toBeDefined();
    });
  });

  describe('2. VKAPS Leadership Verification & Zero-Fabrication Audit', () => {
    it('should return authentic MCA registered directors with verified DINs', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);

      const comp = res.body.data;
      const legalDirectors = comp.legalDirectors || [];
      expect(legalDirectors.length).toBeGreaterThanOrEqual(4);

      // Verify Vinod Mahajan DIN
      const vinod = legalDirectors.find((d) => d.name === 'Vinod Mahajan');
      expect(vinod).toBeDefined();
      expect(vinod.din).toBe('08293966');
      expect(vinod.appointmentDate).toBe('04/12/2018');
      expect(vinod.isVerified).toBe(true);

      // Verify Sudesh Agrawal DIN
      const sudesh = legalDirectors.find((d) => d.name === 'Sudesh Agrawal');
      expect(sudesh).toBeDefined();
      expect(sudesh.din).toBe('09315664');

      // Verify Neetu Agrawal DIN
      const neetu = legalDirectors.find((d) => d.name === 'Neetu Agrawal');
      expect(neetu).toBeDefined();
      expect(neetu.din).toBe('09315665');

      // Verify Sweta DIN
      const sweta = legalDirectors.find((d) => d.name === 'Sweta');
      expect(sweta).toBeDefined();
      expect(sweta.din).toBe('09581333');
    });

    it('should NEVER report Vipin Kaushik with an MCA DIN or statutory directorship', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);

      const comp = res.body.data;
      const legalDirectors = comp.legalDirectors || [];
      const vipinAsDirector = legalDirectors.find((d) => /vipin kaushik/i.test(d.name));
      expect(vipinAsDirector).toBeUndefined();

      // Check operational / business leadership
      const businessLeaders = comp.businessLeadership || [];
      const vipinOperational = businessLeaders.find((l) => /vipin kaushik/i.test(l.name));
      if (vipinOperational) {
        expect(vipinOperational.din).toBeFalsy();
        expect(vipinOperational.isVerified).toBe(false);
        expect(vipinOperational.legalDesignation).toMatch(/Not an MCA Director/i);
      }
    });
  });

  describe('3. Dynamic Evidence-Grounded Scoring & Confidence', () => {
    it('should derive overallScore dynamically from verified categories', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);

      const comp = res.body.data;
      expect(comp.overallScore).toBeDefined();
      expect(typeof comp.overallScore).toBe('number');
      expect(comp.confidence).toBeDefined();
      expect(typeof comp.confidence.percentage).toBe('number');
      // Confidence should not be the hardcoded 88%
      expect(comp.confidence.percentage).not.toBe(88);
      // Sample sources count reflects accessible verified sources
      expect(comp.sampleSourcesCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4. Career Fit Grounding & Zero Hallucination for Specific Roles', () => {
    it('should return fitScore: null and hasSufficientData: false for Backend Developer Fresher when 0 jobs exist', async () => {
      const res = await request(app).get(
        '/api/v1/career-fit/vkaps-it-solutions?role=Backend%20Developer&experience=Fresher'
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const fit = res.body.data;
      expect(fit.fitScore).toBeNull();
      expect(fit.hasSufficientData).toBe(false);
      expect(fit.tier).toBe('Insufficient Role Evidence');
      expect(fit.statusNotice).toMatch(/Insufficient data to calculate career fit/i);
    });
  });

  describe('5. Generalization & Non-Regression Across Companies', () => {
    it('should successfully retrieve TCS without schema errors or hardcoded regressions', async () => {
      const res = await request(app).get('/api/v1/companies/tcs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const comp = res.body.data;
      expect(comp.name).toMatch(/Tata Consultancy Services/i);
      expect(comp.overallScore).toBeDefined();
      expect(comp.confidence).toBeDefined();
    });
  });
});

