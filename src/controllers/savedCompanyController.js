const savedCompanyService = require('../services/savedCompanyService');
const { sendSuccess } = require('../utils/apiResponse');

const getSavedCompanies = async (req, res, next) => {
  try {
    const companies = await savedCompanyService.getSavedCompanies(req.user._id);
    return sendSuccess(res, companies, 'Saved companies retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const saveCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await savedCompanyService.saveCompany(req.user._id, companyId);
    return sendSuccess(res, result, 'Company saved to shortlist', 201);
  } catch (error) {
    next(error);
  }
};

const unsaveCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await savedCompanyService.unsaveCompany(req.user._id, companyId);
    return sendSuccess(res, result, 'Company removed from shortlist');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavedCompanies,
  saveCompany,
  unsaveCompany,
};

