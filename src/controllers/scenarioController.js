const scenarioService = require('../services/scenarioService');
const ResearchHistory = require('../models/ResearchHistory');
const { sendSuccess } = require('../utils/apiResponse');

const calculateScenario = async (req, res, next) => {
  try {
    const { priorities, companyIds } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await scenarioService.calculateScenario(priorities, companyIds, userId);

    if (req.user) {
      ResearchHistory.create({
        userId: req.user._id,
        activity: 'What-If simulation calculated',
        type: 'Comparison',
        context: 'What-If Simulation',
        link: '/what-if',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateGroup: 'TODAY / OCT 28, 2026',
      }).catch(() => {});
    }

    return sendSuccess(res, result, 'What-If scenario calculated successfully');
  } catch (error) {
    next(error);
  }
};

const saveScenario = async (req, res, next) => {
  try {
    const scenario = await scenarioService.saveScenario(req.user._id, req.body);
    return sendSuccess(res, scenario, 'Scenario saved successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getScenarios = async (req, res, next) => {
  try {
    const scenarios = await scenarioService.getScenarios(req.user._id);
    return sendSuccess(res, scenarios, 'What-If scenarios retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getScenarioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const scenario = await scenarioService.getScenarioById(req.user._id, id);
    return sendSuccess(res, scenario, 'What-If scenario retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const deleteScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    await scenarioService.deleteScenario(req.user._id, id);
    return sendSuccess(res, null, 'What-If scenario removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateScenario,
  saveScenario,
  getScenarios,
  getScenarioById,
  deleteScenario,
};

