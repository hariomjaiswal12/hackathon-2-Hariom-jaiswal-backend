const User = require('../models/User');
const CareerDNA = require('../models/CareerDNA');
const SavedCompany = require('../models/SavedCompany');
const ComparisonScenario = require('../models/ComparisonScenario');
const ResearchHistory = require('../models/ResearchHistory');
const AppError = require('../utils/appError');

class SettingsService {
  async getUserSettings(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const researchPreferences = {
      defaultLocation: user.defaultLocation || 'India',
      preferredWorkStyle: user.preferredWorkStyle || 'Hybrid',
      showSourceMetadata: user.researchPreferences?.showSourceMetadata ?? true,
      showConfidence: user.researchPreferences?.showConfidence ?? true,
      useCareerDNAForRecommendations: user.researchPreferences?.useCareerDNAForRecommendations ?? true,
    };

    const notificationPreferences = {
      evidenceUpdates: user.notificationPreferences?.evidenceUpdates ?? true,
      sourceConflictAlerts: user.notificationPreferences?.sourceConflictAlerts ?? true,
      emailDigest: user.notificationPreferences?.emailDigest ?? false,
      digestFrequency: user.notificationPreferences?.digestFrequency || 'Weekly',
    };

    return {
      profile: {
        name: user.name,
        email: user.email,
        careerStage: user.careerStage,
        targetRole: user.targetRole,
        isDemoUser: !!user.isDemoUser,
      },
      researchPreferences,
      // Alias for unified consumer compatibility
      preferences: {
        ...researchPreferences,
        showConfidenceScore: researchPreferences.showConfidence,
        useCareerDNA: researchPreferences.useCareerDNAForRecommendations,
      },
      notificationPreferences,
      // Alias for unified consumer compatibility
      notifications: {
        ...notificationPreferences,
        frequency: notificationPreferences.digestFrequency.toLowerCase(),
      },
    };
  }

  async updateUserSettings(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (updateData.profile) {
      const { name, email, careerStage, targetRole } = updateData.profile;

      if (name && typeof name === 'string') {
        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
          throw new AppError('Name must be at least 2 characters long', 400, 'INVALID_NAME');
        }
        user.name = trimmedName;
      }

      if (email && typeof email === 'string') {
        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail !== user.email) {
          if (user.isDemoUser) {
            throw new AppError(
              'The demo account email is reserved for system verification and cannot be modified.',
              400,
              'DEMO_EMAIL_IMMUTABLE'
            );
          }
          // Check for collision with another account
          const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
          if (existingUser) {
            throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
          }
          user.email = normalizedEmail;
        }
      }

      if (careerStage) {
        user.careerStage = careerStage;
      }

      if (targetRole && typeof targetRole === 'string') {
        user.targetRole = targetRole.trim();
      }
    }

    const rp = updateData.researchPreferences || updateData.preferences;
    if (rp) {
      if (rp.defaultLocation && typeof rp.defaultLocation === 'string') {
        user.defaultLocation = rp.defaultLocation.trim();
      }
      if (rp.preferredWorkStyle) {
        user.preferredWorkStyle = rp.preferredWorkStyle;
      }

      const showConfidence =
        rp.showConfidence !== undefined
          ? rp.showConfidence
          : rp.showConfidenceScore !== undefined
          ? rp.showConfidenceScore
          : undefined;

      const useCareerDNA =
        rp.useCareerDNAForRecommendations !== undefined
          ? rp.useCareerDNAForRecommendations
          : rp.useCareerDNA !== undefined
          ? rp.useCareerDNA
          : undefined;

      user.researchPreferences = {
        showSourceMetadata:
          rp.showSourceMetadata !== undefined
            ? rp.showSourceMetadata
            : (user.researchPreferences?.showSourceMetadata ?? true),
        showConfidence:
          showConfidence !== undefined
            ? showConfidence
            : (user.researchPreferences?.showConfidence ?? true),
        useCareerDNAForRecommendations:
          useCareerDNA !== undefined
            ? useCareerDNA
            : (user.researchPreferences?.useCareerDNAForRecommendations ?? true),
      };
    }

    const np = updateData.notificationPreferences || updateData.notifications;
    if (np) {
      let freq = np.digestFrequency || np.frequency || user.notificationPreferences?.digestFrequency || 'Weekly';
      if (typeof freq === 'string') {
        freq = freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase();
      }

      user.notificationPreferences = {
        evidenceUpdates:
          np.evidenceUpdates !== undefined
            ? np.evidenceUpdates
            : (user.notificationPreferences?.evidenceUpdates ?? true),
        sourceConflictAlerts:
          np.sourceConflictAlerts !== undefined
            ? np.sourceConflictAlerts
            : (user.notificationPreferences?.sourceConflictAlerts ?? true),
        emailDigest:
          np.emailDigest !== undefined
            ? np.emailDigest
            : (user.notificationPreferences?.emailDigest ?? false),
        digestFrequency: ['Daily', 'Weekly', 'Monthly'].includes(freq) ? freq : 'Weekly',
      };
    }

    await user.save();

    // Synchronize Career DNA profile metadata if document exists
    try {
      await CareerDNA.findOneAndUpdate(
        { userId },
        {
          $set: {
            name: user.name,
            targetRole: user.targetRole,
            experience: user.careerStage,
            workStyle: user.preferredWorkStyle,
            preferredLocation: user.defaultLocation,
          },
        }
      );
    } catch (_) {
      // Career DNA sync is advisory
    }

    return this.getUserSettings(userId);
  }

  async exportUserData(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const [careerDNA, savedCompanies, comparisons, history] = await Promise.all([
      CareerDNA.findOne({ userId }).lean(),
      SavedCompany.find({ userId }).populate('companyId', 'name shortName industry location overallScore tier').lean(),
      ComparisonScenario.find({ userId }).lean(),
      ResearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const profileData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      careerStage: user.careerStage,
      targetRole: user.targetRole,
      defaultLocation: user.defaultLocation,
      preferredWorkStyle: user.preferredWorkStyle,
      isDemoUser: !!user.isDemoUser,
      createdAt: user.createdAt,
    };

    return {
      exportedAt: new Date().toISOString(),
      application: 'CompanyIQ',
      version: '1.0.0',
      user: profileData,
      profile: profileData,
      preferences: {
        researchPreferences: user.researchPreferences || {
          showSourceMetadata: true,
          showConfidence: true,
          useCareerDNAForRecommendations: true,
        },
        notificationPreferences: user.notificationPreferences || {
          evidenceUpdates: true,
          sourceConflictAlerts: true,
          emailDigest: false,
          digestFrequency: 'Weekly',
        },
      },
      careerDNA: careerDNA
        ? {
            name: careerDNA.name,
            targetRole: careerDNA.targetRole,
            experience: careerDNA.experience,
            workStyle: careerDNA.workStyle,
            preferredLocation: careerDNA.preferredLocation,
            priorities: careerDNA.priorities,
            skills: careerDNA.skills,
            isComplete: careerDNA.isComplete,
            updatedAt: careerDNA.updatedAt,
          }
        : null,
      savedCompanies: (savedCompanies || []).map((sc) => ({
        companySlug: sc.companySlug,
        companyName: sc.companyId?.name || sc.companySlug,
        industry: sc.companyId?.industry || '',
        location: sc.companyId?.location || '',
        overallScore: sc.companyId?.overallScore || null,
        savedAt: sc.createdAt,
      })),
      comparisonScenarios: (comparisons || []).map((cs) => ({
        title: cs.title,
        description: cs.description,
        companies: cs.companies,
        scenarioType: cs.scenarioType,
        isBaseline: cs.isBaseline,
        createdAt: cs.createdAt,
      })),
      recentResearchHistory: (history || []).map((h) => ({
        activity: h.activity,
        type: h.type,
        context: h.context,
        time: h.time,
        dateGroup: h.dateGroup,
        createdAt: h.createdAt,
      })),
    };
  }

  async clearSavedCompanies(userId) {
    const result = await SavedCompany.deleteMany({ userId });
    return {
      deletedCount: result.deletedCount || 0,
      message: 'Saved companies list cleared successfully',
    };
  }
}

module.exports = new SettingsService();
