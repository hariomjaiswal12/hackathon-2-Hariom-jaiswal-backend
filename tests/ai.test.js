const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const aiService = require('../src/services/aiService');
const { getGeminiClient } = require('../src/config/ai');
const { sanitizeSecrets } = require('../src/utils/sanitizer');

describe('AI Evidence Grounding & Gemini Service Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('GET /api/v1/ai/status', () => {
    it('should return safe provider status without exposing secrets', async () => {
      const res = await request(app).get('/api/v1/ai/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.provider).toBe('gemini');
      expect(typeof res.body.data.configured).toBe('boolean');
      expect(res.body.data.model).toBeDefined();
      expect(['ready', 'suspended', 'error', 'unconfigured']).toContain(res.body.data.status);
      // Ensure no raw API key or token is leaked
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(process.env.GEMINI_API_KEY || 'AIzaSy');
    });
  });

  describe('Strict Company Resolution & Validation', () => {
    it('should reject request when companyId is missing (400 MISSING_COMPANY_ID)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({ question: 'How is work life balance?' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_COMPANY_ID');
    });

    it('should reject request when companyId is invalid or unknown (404 COMPANY_NOT_FOUND)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({ companyId: 'nonexistent-corp-xyz', question: 'How is the culture?' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('COMPANY_NOT_FOUND');
    });
  });

  describe('Multi-Company Evidence Grounding & Citation Validation', () => {
    it('should ground answers for Tata Consultancy Services (TCS)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({
          companyId: 'tcs',
          question: 'How is learning and freshers training at TCS?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const msg = res.body.data.message;
      expect(msg.claim).toBeDefined();
      expect(msg.evidenceRef).toBeDefined();
      expect(msg.sources).toBeDefined();
      expect(msg.sources.length).toBeGreaterThan(0);
      // Fallback is transparently reported if Gemini key is suspended
      if (msg.isFallback) {
        expect(msg.provider).toBe('grounded_rule_engine');
        expect(msg.fallbackReason).toBeDefined();
      }
    });

    it('should ground answers for NVIDIA using real NVIDIA evidence and sources', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({
          companyId: 'nvidia',
          question: 'How is compensation and technology innovation at NVIDIA?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const msg = res.body.data.message;
      expect(msg.claim).toContain('NVIDIA');
      expect(msg.evidenceRef.reviewsCount).toBe(154);
      // NVIDIA specific sources
      expect(msg.sources).toEqual(
        expect.arrayContaining(['NVIDIA official disclosures', 'Verified employee reviews sample'])
      );
      // Should NOT have fake sources like "Sample Source A"
      expect(msg.sources).not.toContain('Sample Source A');
    });

    it('should ground answers for Microsoft using real Microsoft evidence and sources', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({
          companyId: 'microsoft',
          question: 'What is the work-life balance and stability at Microsoft?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const msg = res.body.data.message;
      expect(msg.evidenceRef.reviewsCount).toBe(198);
      expect(msg.sources.length).toBeGreaterThan(0);
      expect(msg.sources).not.toContain('Sample Source A');
    });
  });

  describe('Confidential & Out-of-Scope Query Handling', () => {
    it('should handle unreleased confidential queries cautiously without hallucinating', async () => {
      const res = await request(app)
        .post('/api/v1/ai/ask')
        .send({
          companyId: 'nvidia',
          question: 'What is the unreleased next-gen GPU hardware architecture roadmap and secret project codebase?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const msg = res.body.data.message;
      expect(msg.caveats).toBeDefined();
      expect(msg.text.toLowerCase()).toMatch(/public|unreleased|confidential|evidence|limitations/);
    });
  });

  describe('Mocked Gemini Provider Verification (Legacy & Modern SDK)', () => {
    it('should format response correctly when @google/genai succeeds', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          claim: 'NVIDIA provides industry-leading compensation and GPU innovation.',
          text: 'Employee feedback indicates strong stock performance and competitive compensation packages.',
          sources: ['NVIDIA official disclosures', 'Verified employee reviews sample'],
          confidence: {
            level: 'high',
            percentage: 92,
            label: 'High confidence based on verified disclosures',
          },
          evidenceRef: {
            mentions: 80,
            positive: 72,
            neutral: 5,
            negative: 3,
            sourcesCount: 3,
            reviewsCount: 154,
            checkedDaysAgo: 5,
          },
          followUps: ['How does NVIDIA compare to AMD in culture?'],
          caveats: 'Publicly available disclosures only.',
        }),
      });

      const aiConfig = require('../src/config/ai');
      const spy = jest.spyOn(aiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: mockGenerateContent,
        },
      });

      const res = await aiService.askQuestion({
        companyId: 'nvidia',
        question: 'How is compensation at NVIDIA?',
      });

      expect(res.message.provider).toBe('gemini');
      expect(res.message.isFallback).toBe(false);
      expect(res.message.claim).toBe('NVIDIA provides industry-leading compensation and GPU innovation.');
      expect(res.message.sources).toContain('NVIDIA official disclosures');

      spy.mockRestore();
    }, 20000);

    it('should transparently switch to deterministic grounding engine when Gemini returns 403', async () => {
      const aiConfig = require('../src/config/ai');
      const mockError = new Error('Permission denied: Consumer projects/569186799028 has been suspended (CONSUMER_SUSPENDED)');
      mockError.status = 403;

      const spy = jest.spyOn(aiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: jest.fn().mockRejectedValue(mockError),
        },
      });

      const res = await aiService.askQuestion({
        companyId: 'nvidia',
        question: 'How is work life balance at NVIDIA?',
      });

      expect(res.message.provider).toBe('grounded_rule_engine');
      expect(res.message.isFallback).toBe(true);
      expect(res.message.fallbackReason).toContain('suspended');
      expect(res.message.sources).toContain('NVIDIA official disclosures');

      spy.mockRestore();
    }, 20000);

    it('should handle timeouts and switch to fallback transparently', async () => {
      const aiConfig = require('../src/config/ai');
      const spy = jest.spyOn(aiConfig, 'getGeminiClient').mockReturnValue({
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini API call timed out after 15s')),
        },
      });

      const res = await aiService.askQuestion({
        companyId: 'tcs',
        question: 'How is learning at TCS?',
      });

      expect(res.message.isFallback).toBe(true);
      expect(res.message.provider).toBe('grounded_rule_engine');
      expect(res.message.fallbackReason).toContain('timed out');

      spy.mockRestore();
    }, 20000);
  });

  describe('Secret Sanitization & Anti-Leak Protection', () => {
    it('should scrub API keys and auth headers from strings', () => {
      const sample = 'Error with key=sample_test_key_abc123 and api_key:sample_test_token_xyz987';
      const clean = sanitizeSecrets(sample);
      expect(clean).not.toContain('sample_test_key_abc123');
      expect(clean).not.toContain('sample_test_token_xyz987');
      expect(clean).toContain('[REDACTED]');
    });
  });
});
