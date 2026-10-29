const careerService = require('../services/careerService');
const { sendSuccess } = require('../utils/apiResponse');

const getCareerDNA = async (req, res, next) => {
  try {
    const dna = await careerService.getCareerDNA(req.user._id, req.user.name);
    return sendSuccess(res, dna, 'Career DNA retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const saveCareerDNA = async (req, res, next) => {
  try {
    const dna = await careerService.saveOrUpdateCareerDNA(req.user._id, req.body, req.user.name);
    return sendSuccess(res, dna, 'Career DNA saved successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCareerDNA = async (req, res, next) => {
  try {
    await careerService.deleteCareerDNA(req.user._id);
    return sendSuccess(res, null, 'Career DNA reset successfully');
  } catch (error) {
    next(error);
  }
};

const getAllCareerFits = async (req, res, next) => {
  try {
    const fits = await careerService.getAllCareerFits(req.user._id);
    return sendSuccess(res, fits, 'Career Fit calculations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCompanyCareerFit = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user ? req.user._id : null;
    const fit = await careerService.getCompanyCareerFit(userId, companyId, req.query);
    return sendSuccess(res, fit, 'Company Career Fit retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareerDNA,
  saveCareerDNA,
  deleteCareerDNA,
  getAllCareerFits,
  getCompanyCareerFit,
};

