const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class GoogleAuthService {
  constructor() {
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
    this.callbackUrl = env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';
    this.client = new OAuth2Client(this.clientId, this.clientSecret, this.callbackUrl);
  }

  isConfigured() {
    return Boolean(
      this.clientId &&
      this.clientId !== 'your_google_oauth_client_id' &&
      !this.clientId.startsWith('your_')
    );
  }

  getOAuth2Client(customRedirectUri) {
    const redirectUri = customRedirectUri || this.callbackUrl;
    return new OAuth2Client(this.clientId, this.clientSecret, redirectUri);
  }

  /**
   * Generates the standard Google OAuth 2.0 authorization URL for redirect flow.
   *
   * @param {string} state - Base64 encoded or string state to maintain between redirect and callback
   * @param {string} [customRedirectUri] - Optional custom callback URI
   * @returns {string} Google authorization URL
   */
  getAuthorizationUrl(state = '', customRedirectUri = '') {
    if (!this.isConfigured()) {
      throw new AppError(
        'Google OAuth 2.0 Client ID is not configured on the server. Please configure GOOGLE_CLIENT_ID.',
        500,
        'GOOGLE_AUTH_NOT_CONFIGURED'
      );
    }

    const client = this.getOAuth2Client(customRedirectUri);
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      state: state || 'companyiq_oauth_state',
    });
  }

  /**
   * Exchanges an authorization code for tokens and extracts verified user profile.
   *
   * @param {string} code - The authorization code returned by Google
   * @param {string} [customRedirectUri] - The redirect URI that was used when requesting the code
   * @returns {Promise<{ sub: string, email: string, name: string, picture: string, email_verified: boolean }>}
   */
  async exchangeCodeForTokens(code, customRedirectUri = '') {
    if (!code || typeof code !== 'string') {
      throw new AppError('Google authorization code is required', 400, 'MISSING_AUTH_CODE');
    }

    try {
      const client = this.getOAuth2Client(customRedirectUri);
      const { tokens } = await client.getToken(code);

      if (tokens.id_token) {
        // Verify the ID token returned in the token response
        return await this.verifyIdToken(tokens.id_token);
      }

      // If id_token wasn't included, use userinfo endpoint with the access token
      client.setCredentials(tokens);
      const res = await client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });
      const data = res.data;

      if (!data || !data.sub || !data.email) {
        throw new AppError('Incomplete user profile received from Google', 400, 'INVALID_GOOGLE_PROFILE');
      }

      return {
        sub: data.sub,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture || null,
        email_verified: !!data.email_verified,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn('[GoogleAuthService] Code exchange failed:', { error: err.message });
      throw new AppError(
        `Failed to exchange authorization code with Google: ${err.message}`,
        400,
        'GOOGLE_CODE_EXCHANGE_FAILED'
      );
    }
  }

  /**
   * Verifies a Google ID Token received from Google Identity Services (GIS).
   *
   * @param {string} idToken - The signed JWT ID token from Google
   * @returns {Promise<{ sub: string, email: string, name: string, picture: string, email_verified: boolean }>}
   */
  async verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      throw new AppError('Google ID token is required', 400, 'MISSING_GOOGLE_TOKEN');
    }

    try {
      const configured = this.isConfigured();

      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: configured ? this.clientId : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError('Empty payload received from Google token verification', 401, 'INVALID_GOOGLE_TOKEN');
      }

      // 1. Validate Google Subject Identifier
      if (!payload.sub) {
        throw new AppError('Google token does not contain a valid user identifier (sub)', 401, 'INVALID_GOOGLE_TOKEN');
      }

      // 2. Validate Issuer
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss)) {
        throw new AppError('Invalid token issuer. Must originate from Google.', 401, 'INVALID_TOKEN_ISSUER');
      }

      // 3. Validate Expiration
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowInSeconds) {
        throw new AppError('Google authentication token has expired. Please sign in again.', 401, 'GOOGLE_TOKEN_EXPIRED');
      }

      // 4. Validate Email & Verification
      if (!payload.email) {
        throw new AppError('Google account does not have an associated email address.', 400, 'MISSING_GOOGLE_EMAIL');
      }

      if (!payload.email_verified) {
        throw new AppError('Google email address has not been verified by Google.', 403, 'UNVERIFIED_GOOGLE_EMAIL');
      }

      // 5. Audience validation (if Google Client ID is configured in environment)
      if (configured && payload.aud !== this.clientId) {
        throw new AppError('Token audience mismatch. Token was not issued for this application.', 401, 'AUDIENCE_MISMATCH');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null,
        email_verified: !!payload.email_verified,
      };
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      logger.warn('[GoogleAuthService] Token verification failed:', { error: err.message });
      throw new AppError('Invalid or expired Google authentication token.', 401, 'INVALID_GOOGLE_TOKEN');
    }
  }
}

module.exports = new GoogleAuthService();
