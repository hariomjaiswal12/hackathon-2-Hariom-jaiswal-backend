const authService = require('../services/authService');
const googleAuthService = require('../services/googleAuthService');
const env = require('../config/env');
const logger = require('../utils/logger');
const { sendSuccess } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return sendSuccess(res, user, 'Profile retrieved', 200);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return sendSuccess(res, result, 'Token refreshed successfully', 200);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user._id, refreshToken);
    return sendSuccess(res, null, 'Logged out successfully', 200);
  } catch (error) {
    next(error);
  }
};

const demoLogin = async (req, res, next) => {
  try {
    const result = await authService.demoLogin();
    return sendSuccess(res, result, 'Demo login successful', 200);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return sendSuccess(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return sendSuccess(res, result, result.message, 200);
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const idToken = req.body.credential || req.body.idToken || req.body.token;
    const result = await authService.loginWithGoogle(idToken);
    return sendSuccess(res, result, 'Google authentication successful', 200);
  } catch (error) {
    next(error);
  }
};

const googleAuthInit = async (req, res, next) => {
  try {
    const rawOrigin = req.query.origin || req.headers.referer || '';
    let clientOrigin = '';
    try {
      if (rawOrigin) {
        const parsed = new URL(rawOrigin);
        clientOrigin = parsed.origin;
      }
    } catch (_) {}

    const returnTo = req.query.returnTo || '/dashboard';
    const statePayload = JSON.stringify({ origin: clientOrigin, returnTo });
    const state = Buffer.from(statePayload).toString('base64url');

    const authUrl = googleAuthService.getAuthorizationUrl(state);

    if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return sendSuccess(res, { url: authUrl }, 'Google authorization URL generated', 200);
    }
    return res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

const googleCallback = async (req, res, next) => {
  let targetOrigin = (env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
  let returnTo = '/dashboard';

  try {
    if (req.query.state) {
      try {
        const decoded = JSON.parse(Buffer.from(req.query.state, 'base64url').toString('utf-8'));
        if (decoded.origin) {
          const originUrl = new URL(decoded.origin);
          if (
            originUrl.hostname === 'localhost' ||
            originUrl.hostname === '127.0.0.1' ||
            originUrl.hostname.endsWith('.vercel.app')
          ) {
            targetOrigin = decoded.origin.replace(/\/$/, '');
          }
        }
        if (decoded.returnTo && decoded.returnTo.startsWith('/')) {
          returnTo = decoded.returnTo;
        }
      } catch (_) {}
    }

    const { code, error, error_description } = req.query;

    if (error) {
      logger.warn('[AuthController] Google returned error:', { error, error_description });
      if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({
          success: false,
          error: { code: error, message: error_description || 'Google login cancelled' },
        });
      }
      return res.redirect(
        `${targetOrigin}/auth/callback?error=${encodeURIComponent(error)}&message=${encodeURIComponent(error_description || 'Google login cancelled')}`
      );
    }

    if (!code) {
      if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_CODE', message: 'Authorization code is required' },
        });
      }
      return res.redirect(`${targetOrigin}/auth/callback?error=MISSING_CODE`);
    }

    const result = await authService.handleGoogleCallback(code);
    const { tokens, user } = result;

    if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return sendSuccess(res, { tokens, user }, 'Google authentication successful', 200);
    }

    return res.redirect(
      `${targetOrigin}/auth/callback?token=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}&returnTo=${encodeURIComponent(returnTo)}`
    );
  } catch (error) {
    logger.error('[AuthController] Google callback processing failed:', { message: error.message });
    const errCode = error.errorCode || 'GOOGLE_AUTH_FAILED';
    const errMessage = error.message || 'Google authentication failed';

    if (req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      const statusCode = error.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        error: { code: errCode, message: errMessage },
      });
    }

    return res.redirect(
      `${targetOrigin}/auth/callback?error=${encodeURIComponent(errCode)}&message=${encodeURIComponent(errMessage)}`
    );
  }
};

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
  demoLogin,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleAuthInit,
  googleCallback,
};

