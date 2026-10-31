const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const googleAuthService = require('./googleAuthService');

class AuthService {
  async register(userData) {
    const { name, email, password, careerStage, targetRole, defaultLocation, preferredWorkStyle } = userData;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: name?.trim(),
      email: normalizedEmail,
      passwordHash,
      careerStage: careerStage || 'Fresher',
      targetRole: targetRole || 'Backend Developer',
      defaultLocation: defaultLocation || 'India',
      preferredWorkStyle: preferredWorkStyle || 'Hybrid',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        careerStage: user.careerStage,
        targetRole: user.targetRole,
        defaultLocation: user.defaultLocation,
        preferredWorkStyle: user.preferredWorkStyle,
        isDemoUser: !!user.isDemoUser,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(email, password) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Keep up to 5 active sessions
    const updatedTokens = [...(user.refreshTokens || []).slice(-4), { token: refreshToken }];
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: updatedTokens } });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        careerStage: user.careerStage,
        targetRole: user.targetRole,
        defaultLocation: user.defaultLocation,
        preferredWorkStyle: user.preferredWorkStyle,
        isDemoUser: !!user.isDemoUser,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(oldRefreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const tokenExists = user.refreshTokens.some((t) => t.token === oldRefreshToken);
    if (!tokenExists) {
      // Possible token reuse attempt: clear all refresh tokens for security
      await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
      throw new AppError('Invalid refresh token. Please log in again.', 401, 'TOKEN_REUSE_DETECTED');
    }

    // Rotate refresh token
    const remainingTokens = user.refreshTokens.filter((t) => t.token !== oldRefreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    remainingTokens.push({ token: newRefreshToken });
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: remainingTokens } });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId, refreshToken) {
    if (!userId) return;
    if (refreshToken) {
      await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: { token: refreshToken } } });
    } else {
      await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
    }
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async demoLogin() {
    const demoEmail = 'demo@companyiq.internal';
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      // Create dedicated demo user using secure bcrypt password hashing
      const initialPassword = process.env.DEMO_PASSWORD || (crypto.randomBytes(16).toString('hex') + '!Aa1');
      const passwordHash = await User.hashPassword(initialPassword);
      user = await User.create({
        name: 'Demo Guest',
        email: demoEmail,
        passwordHash,
        role: 'user',
        isDemoUser: true,
        careerStage: 'Fresher',
        targetRole: 'Full Stack Engineer',
        defaultLocation: 'Bangalore, India',
        preferredWorkStyle: 'Hybrid',
      });
      logger.info(`[AuthService] Dedicated demo account initialized: ${demoEmail}`);
    } else if (!user.isDemoUser) {
      user.isDemoUser = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const updatedTokens = [...(user.refreshTokens || []).slice(-4), { token: refreshToken }];
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: updatedTokens } });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        careerStage: user.careerStage,
        targetRole: user.targetRole,
        defaultLocation: user.defaultLocation,
        preferredWorkStyle: user.preferredWorkStyle,
        isDemoUser: true,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async forgotPassword(email) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to prevent user enumeration
    const genericResponse = {
      message: 'If an account exists with this email address, password reset instructions have been generated.',
    };

    if (!user) {
      return genericResponse;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await user.save();

    return {
      ...genericResponse,
      resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resetPassword(token, newPassword) {
    if (!token) {
      throw new AppError('Password reset token is required', 400, 'BAD_REQUEST');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    const passwordHash = await User.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshTokens = []; // Clear all active sessions on password change
    await user.save();

    return {
      message: 'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Internal helper to find, link or create a Google user and generate session tokens.
   *
   * @param {{ sub: string, email: string, name: string, picture: string, email_verified: boolean }} verified
   * @returns {Promise<{ user: Object, tokens: { accessToken: string, refreshToken: string } }>}
   */
  async findOrCreateGoogleUser(verified) {
    const { sub: googleId, email, name, picture: avatar, email_verified } = verified;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // 1. Check if user already exists with this googleId
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with this Google account: update avatar if provided and not yet set
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        await user.save();
      }
    } else {
      // 2. Check if a user with this email already exists
      const existingEmailUser = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

      if (existingEmailUser) {
        // Safe account linking protection:
        // Do not automatically link if account was registered with email & password.
        if (existingEmailUser.passwordHash) {
          throw new AppError(
            'An account with this email address already exists using password authentication. Please sign in with your password to continue.',
            409,
            'ACCOUNT_EXISTS_WITH_PASSWORD'
          );
        }

        // If existing user was created without password, link Google ID
        existingEmailUser.googleId = googleId;
        if (avatar && !existingEmailUser.avatar) {
          existingEmailUser.avatar = avatar;
        }
        user = await existingEmailUser.save();
      } else {
        // 3. Create a brand new Google user
        try {
          user = await User.create({
            name: name?.trim() || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            googleId,
            avatar: avatar || null,
            authProvider: 'google',
            isEmailVerified: !!email_verified,
            careerStage: 'Fresher',
            targetRole: 'Backend Developer',
            defaultLocation: 'India',
            preferredWorkStyle: 'Hybrid',
          });
          logger.info(`[AuthService] New user registered via Google OAuth: ${normalizedEmail}`);
        } catch (createErr) {
          if (createErr.code === 11000) {
            // Race condition / duplicate key
            user = await User.findOne({ googleId });
            if (!user) {
              user = await User.findOne({ email: normalizedEmail });
            }
            if (!user) {
              throw new AppError('Error creating Google user account. Please try again.', 500, 'USER_CREATION_FAILED');
            }
          } else {
            throw createErr;
          }
        }
      }
    }

    // 4. Generate application JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Keep up to 5 active sessions
    const updatedTokens = [...(user.refreshTokens || []).slice(-4), { token: refreshToken }];
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: updatedTokens } });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        careerStage: user.careerStage,
        targetRole: user.targetRole,
        defaultLocation: user.defaultLocation,
        preferredWorkStyle: user.preferredWorkStyle,
        avatar: user.avatar,
        authProvider: user.authProvider || 'google',
        isDemoUser: !!user.isDemoUser,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Authenticates or registers a user via Google OAuth 2.0 ID token.
   *
   * @param {string} idToken - The Google signed JWT ID token
   * @returns {Promise<{ user: Object, tokens: { accessToken: string, refreshToken: string } }>}
   */
  async loginWithGoogle(idToken) {
    const verified = await googleAuthService.verifyIdToken(idToken);
    return await this.findOrCreateGoogleUser(verified);
  }

  /**
   * Handles Google OAuth 2.0 redirect callback with authorization code.
   *
   * @param {string} code - Authorization code from Google redirect
   * @param {string} [redirectUri] - Callback URI matching redirect
   * @returns {Promise<{ user: Object, tokens: { accessToken: string, refreshToken: string } }>}
   */
  async handleGoogleCallback(code, redirectUri = '') {
    const verified = await googleAuthService.exchangeCodeForTokens(code, redirectUri);
    return await this.findOrCreateGoogleUser(verified);
  }
}

module.exports = new AuthService();

