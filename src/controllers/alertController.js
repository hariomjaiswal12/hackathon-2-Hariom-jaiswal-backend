const alertService = require('../services/alertService');
const savedCompanyService = require('../services/savedCompanyService');
const { sendSuccess } = require('../utils/apiResponse');

const getAlerts = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const alerts = await alertService.getAlerts(userId);
    return sendSuccess(res, alerts, 'Watchlist alerts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const markAlertAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await alertService.markAsRead(req.user._id, id);
    return sendSuccess(res, updated, 'Alert marked as read');
  } catch (error) {
    next(error);
  }
};

// Watchlist endpoints
const getWatchlist = async (req, res, next) => {
  try {
    const companies = await savedCompanyService.getSavedCompanies(req.user._id);
    return sendSuccess(res, companies, 'Watchlist companies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await savedCompanyService.saveCompany(req.user._id, companyId);
    return sendSuccess(res, result, 'Company added to watchlist', 201);
  } catch (error) {
    next(error);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await savedCompanyService.unsaveCompany(req.user._id, companyId);
    return sendSuccess(res, result, 'Company removed from watchlist');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  markAlertAsRead,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};

