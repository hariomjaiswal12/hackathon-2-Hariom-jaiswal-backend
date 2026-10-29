const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  /**
   * Verifies a Google ID Token received from Google Identity Services.
   *
   * @param {string} idToken - The signed JWT ID token from Google
   * @returns {Promise<{ sub: string, email: string, name: string, picture: string, email_verified: boolean }>}
   */
  async verifyIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      throw new AppError('Google ID token is required', 400, 'MISSING_GOOGLE_TOKEN');
    }

    try {
      const isConfigured =
        env.GOOGLE_CLIENT_ID &&
        env.GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id' &&
        !env.GOOGLE_CLIENT_ID.startsWith('your_');

      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: isConfigured ? env.GOOGLE_CLIENT_ID : undefined,
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
      if (isConfigured && payload.aud !== env.GOOGLE_CLIENT_ID) {
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

