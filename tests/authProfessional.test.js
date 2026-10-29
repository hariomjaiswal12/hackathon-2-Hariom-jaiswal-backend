const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');

describe('Professional & Secure Authentication Suite', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const testEmail = `pro_auth_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword2026!';
  let accessToken = '';
  let refreshToken = '';

  // 1. Clean Registration
  describe('User Registration', () => {
    it('should reject registration when email or password is missing/invalid', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Incomplete User',
        email: 'invalid-email-format',
        password: '123', // Under 6 characters
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should register a new account with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Professional User',
        email: testEmail,
        password: testPassword,
        careerStage: 'Fresher',
        targetRole: 'Full Stack Engineer',
        preferredWorkStyle: 'Hybrid',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should reject duplicate email registration with a friendly message', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate User',
        email: testEmail,
        password: testPassword,
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
      expect(res.body.error.message).toMatch(/already exists/i);
    });
  });

  // 2. Authentication & Verification
  describe('User Login & Session Management', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: 'WrongPassword999!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid email or password/i);
    });

    it('should reject login for non-existent email with generic error', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nobody_exists_here_999@example.com',
        password: 'SomePassword123!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid email or password/i);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: testPassword,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('should restore session via GET /api/v1/auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.name).toBe('Professional User');
    });

    it('should refresh access token using valid refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Update tokens
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should logout and invalidate refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the old refresh token is no longer accepted
      const resRef = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(resRef.status).toBe(401);
    });
  });

  // 3. Optional Backend Demo Access
  describe('Dedicated Backend Demo Access', () => {
    it('should authenticate demo user without exposing secrets in form state', async () => {
      const res = await request(app).post('/api/v1/auth/demo');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });
  });

  // 4. Password Reset Flow
  describe('Password Reset Lifecycle', () => {
    let resetToken = '';

    it('should handle forgot-password gracefully and issue reset token', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: testEmail,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();
      resetToken = res.body.data.resetToken;
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewlyChangedPassword2026!';
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: resetToken,
        password: newPassword,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testEmail,
        password: newPassword,
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });

    it('should reject password reset with expired or invalid token', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: 'invalid-or-already-used-token-xyz',
        password: 'AnotherPassword2026!',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });
});

