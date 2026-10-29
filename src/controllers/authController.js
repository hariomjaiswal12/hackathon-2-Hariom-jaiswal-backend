const authService = require('../services/authService');
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
};

