const aiService = require('../services/aiService');
const ResearchHistory = require('../models/ResearchHistory');
const { sendSuccess } = require('../utils/apiResponse');

const getStatus = async (req, res, next) => {
  try {
    const status = await aiService.getProviderStatus();
    return sendSuccess(res, status, 'AI provider status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const ask = async (req, res, next) => {
  try {
    const { companyId, question, threadId } = req.body;
    const userId = req.user ? req.user._id : null;

    const result = await aiService.askQuestion({
      companyId,
      question,
      threadId,
      userId,
    });

    if (userId) {
      ResearchHistory.create({
        userId,
        activity: question.length > 50 ? `${question.slice(0, 47)}...` : question,
        type: 'AI question',
        context: `${companyId?.toUpperCase() || 'Company'} · AI Q&A`,
        link: '/ask',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateGroup: 'TODAY / OCT 28, 2026',
      }).catch(() => {});
    }

    return sendSuccess(res, result, 'AI response generated successfully');
  } catch (error) {
    next(error);
  }
};

const getThreads = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const threads = await aiService.getThreads(userId);
    return sendSuccess(res, threads, 'AI conversation threads retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getThreadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thread = await aiService.getThreadById(id);
    return sendSuccess(res, thread, 'Thread retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  ask,
  getThreads,
  getThreadById,
};
