const settingsService = require('../services/settingsService');
const historyService = require('../services/historyService');
const careerService = require('../services/careerService');
const { sendSuccess } = require('../utils/apiResponse');

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getUserSettings(req.user._id);
    return sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updated = await settingsService.updateUserSettings(req.user._id, req.body);
    return sendSuccess(res, updated, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

const exportUserData = async (req, res, next) => {
  try {
    const exportData = await settingsService.exportUserData(req.user._id);
    return sendSuccess(res, exportData, 'User data exported successfully');
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await historyService.clearHistory(req.user._id);
    return sendSuccess(res, null, 'Research history cleared');
  } catch (error) {
    next(error);
  }
};

const deleteCareerDNA = async (req, res, next) => {
  try {
    await careerService.deleteCareerDNA(req.user._id);
    return sendSuccess(res, null, 'Career DNA reset to defaults');
  } catch (error) {
    next(error);
  }
};

const clearSavedCompanies = async (req, res, next) => {
  try {
    await settingsService.clearSavedCompanies(req.user._id);
    return sendSuccess(res, null, 'Saved companies list cleared');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  exportUserData,
  clearHistory,
  deleteCareerDNA,
  clearSavedCompanies,
};
