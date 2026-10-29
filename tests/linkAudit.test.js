const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const Company = require('../src/models/Company');
const Source = require('../src/models/Source');
const { validateExternalUrl, sanitizeDataSources, sanitizeSocialLinks } = require('../src/utils/urlValidator');

describe('CompanyIQ Link Audit & Verification Test Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('1. URL Validator & Sanitizer Utility', () => {
    test('should reject broken placeholders such as /unavailable/, example.com, #, and empty strings', () => {
      expect(validateExternalUrl('https://www.linkedin.com/company/unavailable/').isValid).toBe(false);
      expect(validateExternalUrl('https://example.com/company').isValid).toBe(false);
      expect(validateExternalUrl('#').isValid).toBe(false);
      expect(validateExternalUrl('').isValid).toBe(false);
      expect(validateExternalUrl(null).isValid).toBe(false);
      expect(validateExternalUrl(undefined).isValid).toBe(false);
      expect(validateExternalUrl('http://localhost:3000').isValid).toBe(false);
    });

    test('should accept genuine, well-formed public URLs', () => {
      const v1 = validateExternalUrl('https://www.mca.gov.in/');
      expect(v1.isValid).toBe(true);
      expect(v1.sanitizedUrl).toBe('https://www.mca.gov.in');

      const v2 = validateExternalUrl('https://vkaps.com');
      expect(v2.isValid).toBe(true);
      expect(v2.sanitizedUrl).toBe('https://vkaps.com');

      const v3 = validateExternalUrl('https://clutch.co/profile/vkaps-it-solutions');
      expect(v3.isValid).toBe(true);
      expect(v3.sanitizedUrl).toBe('https://clutch.co/profile/vkaps-it-solutions');
    });

    test('should sanitize social links and nullify placeholders', () => {
      const sanitized = sanitizeSocialLinks({
        linkedin: 'https://www.linkedin.com/company/unavailable/',
        clutch: 'https://clutch.co/profile/vkaps-it-solutions',
        github: 'https://github.com/vkapsitsolutions',
        dummy: '#',
      });
      expect(sanitized.linkedin).toBeNull();
      expect(sanitized.dummy).toBeNull();
      expect(sanitized.clutch).toBe('https://clutch.co/profile/vkaps-it-solutions');
      expect(sanitized.github).toBe('https://github.com/vkapsitsolutions');
    });

    test('should sanitize data sources array with availability status', () => {
      const sources = [
        { provider: 'MCA', sourceUrl: 'https://www.mca.gov.in/' },
        { provider: 'Broken Source', sourceUrl: 'https://www.linkedin.com/company/unavailable/' },
      ];
      const sanitized = sanitizeDataSources(sources);
      expect(sanitized[0].isAvailable).toBe(true);
      expect(sanitized[0].sourceUrl).toBe('https://www.mca.gov.in');
      expect(sanitized[1].isAvailable).toBe(false);
      expect(sanitized[1].sourceUrl).toBeNull();
      expect(sanitized[1].availabilityNotice).toBeDefined();
    });
  });

  describe('2. VKAPS IT Solutions Link Integrity API Audit', () => {
    test('GET /api/v1/companies/vkaps-it-solutions returns genuine links and disabled unavailable links', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const comp = res.body.data;

      // Official website & careers
      expect(comp.website).toBe('https://vkaps.com');
      expect(['https://vkaps.com/careers', 'https://vkaps.com/contact']).toContain(comp.workforce.careersUrl);

      // Social Links
      expect(comp.socialLinks.clutch).toBe('https://clutch.co/profile/vkaps-it-solutions');
      expect(comp.socialLinks.github).toBe('https://github.com/vkapsitsolutions');
      expect(comp.socialLinks.linkedin).toBeNull(); // Must NOT be clickable to unavailable

      // Leadership links
      if (comp.leadership && comp.leadership.length > 0) {
        expect(comp.leadership[0].linkedinUrl).toBeNull();
      }

      // Data sources
      expect(Array.isArray(comp.dataSources)).toBe(true);
      const mcaSource = comp.dataSources.find((ds) => ds.provider.includes('MCA'));
      expect(mcaSource).toBeDefined();
      expect(mcaSource.sourceUrl).toBe('https://www.mca.gov.in');
      expect(mcaSource.isAvailable).toBe(true);

      const clutchSource = comp.dataSources.find((ds) => ds.provider.includes('Clutch'));
      expect(clutchSource).toBeDefined();
      expect(clutchSource.sourceUrl).toBe('https://clutch.co/profile/vkaps-it-solutions');
      expect(clutchSource.isAvailable).toBe(true);

      const linkedInSource = comp.dataSources.find((ds) => ds.provider.includes('LinkedIn'));
      expect(linkedInSource).toBeDefined();
      expect(linkedInSource.sourceUrl).toBeNull();
      expect(linkedInSource.isAvailable).toBe(false);
      expect(linkedInSource.availabilityNotice).toContain('External profile not verified');
    });

    test('GET /api/v1/companies/vkaps-it-solutions/sources returns clean, non-dead-end sources', async () => {
      const res = await request(app).get('/api/v1/companies/vkaps-it-solutions/sources');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sources = res.body.data;
      expect(Array.isArray(sources)).toBe(true);

      sources.forEach((s) => {
        if (s.isAvailable) {
          expect(s.url).toMatch(/^https:\/\//);
          expect(s.url).not.toContain('unavailable');
          expect(s.url).not.toContain('example.com');
        } else {
          expect(s.url).toBeNull();
          expect(s.availabilityNotice).toBeTruthy();
        }
      });
    });
  });

  describe('3. Database-Wide Link Integrity Audit', () => {
    test('no company document in MongoDB should contain broken placeholder URLs', async () => {
      const companies = await Company.find({}).lean();
      for (const comp of companies) {
        // Check website
        if (comp.website) {
          expect(comp.website).not.toContain('unavailable');
          expect(comp.website).not.toContain('example.com');
          expect(comp.website).not.toBe('#');
        }

        // Check careersUrl
        if (comp.workforce?.careersUrl) {
          expect(comp.workforce.careersUrl).not.toContain('unavailable');
          expect(comp.workforce.careersUrl).not.toContain('example.com');
          expect(comp.workforce.careersUrl).not.toBe('#');
        }

        // Check social links
        if (comp.socialLinks) {
          for (const url of Object.values(comp.socialLinks)) {
            if (url) {
              expect(url).not.toContain('unavailable');
              expect(url).not.toContain('example.com');
              expect(url).not.toBe('#');
            }
          }
        }

        // Check data sources
        if (Array.isArray(comp.dataSources)) {
          for (const ds of comp.dataSources) {
            const rawUrl = ds.sourceUrl || ds.url;
            if (rawUrl) {
              expect(rawUrl).not.toContain('unavailable');
              expect(rawUrl).not.toContain('example.com');
              expect(rawUrl).not.toBe('#');
            }
          }
        }
      }
    });

    test('no source document in MongoDB should contain broken placeholder URLs', async () => {
      const sources = await Source.find({}).lean();
      for (const src of sources) {
        if (src.url) {
          expect(src.url).not.toContain('unavailable');
          expect(src.url).not.toContain('example.com');
          expect(src.url).not.toBe('#');
        }
      }
    });
  });
});
