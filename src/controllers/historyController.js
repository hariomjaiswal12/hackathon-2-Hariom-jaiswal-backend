const historyService = require('../services/historyService');
const { sendSuccess } = require('../utils/apiResponse');

const getHistory = async (req, res, next) => {
  try {
    const { type = 'all' } = req.query;
    const history = await historyService.getHistory(req.user._id, type);
    return sendSuccess(res, history, 'Research history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const addHistory = async (req, res, next) => {
  try {
    const item = await historyService.addHistory(req.user._id, req.body);
    return sendSuccess(res, item, 'Activity added to history', 201);
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await historyService.clearHistory(req.user._id);
    return sendSuccess(res, null, 'Research history cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHistory,
  addHistory,
  clearHistory,
};

