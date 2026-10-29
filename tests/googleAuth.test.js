const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const env = require('../src/config/env');
const User = require('../src/models/User');
const googleAuthService = require('../src/services/googleAuthService');

describe('Google OAuth 2.0 Authentication & Session Suite', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Clean up test users created during test run
    await User.deleteMany({
      email: { $in: [/google\.test\..*@example\.com/, /existing\.pass\..*@example\.com/] },
    });
    await mongoose.disconnect();
  });

  // --- 1. Validation & Bad Token Rejection ---
  describe('Input Validation & Invalid Token Handling', () => {
    it('should reject request when credential/idToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/google').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request when credential is not a string', async () => {
      const res = await request(app).post('/api/v1/auth/google').send({ credential: 12345 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid or expired Google ID token with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'invalid.google.jwt.token' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_GOOGLE_TOKEN');
    });
  });

  // --- 2. New User Registration via Google OAuth ---
  describe('New User Registration via Google OAuth', () => {
    const mockGoogleId = `google_sub_${Date.now()}`;
    const mockEmail = `google.test.${Date.now()}@example.com`;
    let googleAccessToken = '';
    let googleRefreshToken = '';

    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully register and authenticate new user via verified Google token', async () => {
      jest.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValueOnce({
        sub: mockGoogleId,
        email: mockEmail,
        name: 'Google Engineer User',
        picture: 'https://lh3.googleusercontent.com/a/mock-pic',
        email_verified: true,
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'valid.mocked.google.token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(mockEmail.toLowerCase());
      expect(res.body.data.user.name).toBe('Google Engineer User');
      expect(res.body.data.user.avatar).toBe('https://lh3.googleusercontent.com/a/mock-pic');
      expect(res.body.data.user.authProvider).toBe('google');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      googleAccessToken = res.body.data.tokens.accessToken;
      googleRefreshToken = res.body.data.tokens.refreshToken;

      // Verify user was stored in MongoDB with googleId and without password
      const dbUser = await User.findOne({ googleId: mockGoogleId }).select('+passwordHash');
      expect(dbUser).not.toBeNull();
      expect(dbUser.email).toBe(mockEmail.toLowerCase());
      expect(dbUser.passwordHash).toBeUndefined(); // Google-only accounts do not require password
      expect(dbUser.authProvider).toBe('google');
    });

    it('should authenticate existing Google user without creating duplicate', async () => {
      jest.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValueOnce({
        sub: mockGoogleId,
        email: mockEmail,
        name: 'Google Engineer User',
        picture: 'https://lh3.googleusercontent.com/a/mock-pic-updated',
        email_verified: true,
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'valid.mocked.google.token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(mockEmail.toLowerCase());

      // Confirm only 1 user exists in DB
      const count = await User.countDocuments({ googleId: mockGoogleId });
      expect(count).toBe(1);
    });

    it('should access /api/v1/auth/me using Google-issued access token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${googleAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(mockEmail.toLowerCase());
      expect(res.body.data.name).toBe('Google Engineer User');
    });

    it('should refresh tokens using Google-issued refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: googleRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should end session cleanly via /api/v1/auth/logout', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${googleAccessToken}`)
        .send({ refreshToken: googleRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --- 3. Account Linking Protection ---
  describe('Account Linking Protection (Password Account Safeguards)', () => {
    const existingPasswordEmail = `existing.pass.${Date.now()}@example.com`;

    beforeAll(async () => {
      // Create user with local email + password
      const passwordHash = await User.hashPassword('MySecretPass2026!');
      await User.create({
        name: 'Password User',
        email: existingPasswordEmail,
        passwordHash,
        authProvider: 'local',
        careerStage: '1-2 years',
        targetRole: 'Full Stack Engineer',
      });
    });

    it('should not automatically overwrite or link password account with Google login', async () => {
      jest.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValueOnce({
        sub: `google_attacker_${Date.now()}`,
        email: existingPasswordEmail,
        name: 'Imposter User',
        picture: null,
        email_verified: true,
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'valid.mocked.google.token' });

      // Must reject with 409 Conflict
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_EXISTS_WITH_PASSWORD');
      expect(res.body.error.message).toMatch(/password authentication/i);

      // Verify the original user still has their original passwordHash and was not overwritten
      const originalUser = await User.findOne({ email: existingPasswordEmail }).select('+passwordHash');
      expect(originalUser.passwordHash).toBeDefined();
      expect(originalUser.googleId).toBeUndefined();
      expect(originalUser.name).toBe('Password User');
    });
  });
});

