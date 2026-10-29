const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const data = await dashboardService.getDashboardData(userId);
    return sendSuccess(res, data, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

