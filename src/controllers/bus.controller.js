const Bus = require('../models/Bus');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getBuses = async (req, res, next) => {
  try {
    const baseQuery = { institution: req.user.institution, status: { $ne: 'inactive' } };
    let features = new ApiFeatures(Bus.find(baseQuery).populate({ path: 'driver', populate: { path: 'user' } }).populate('route'), req.query)
      .search(['registrationNumber'])
      .paginate();

    features.searchFields = ['registrationNumber'];
    await features.countTotal(Bus, baseQuery);
    const buses = await features.query;

    res.status(200).json({
      success: true,
      data: buses,
      pagination: {
        total: features.totalDocuments,
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createBus = async (req, res, next) => {
  try {
    const existing = await Bus.findOne({ registrationNumber: req.body.registrationNumber });
    if (existing) return sendError(res, 400, 'Bus registration number already exists');

    const bus = await Bus.create({ ...req.body, institution: req.user.institution });
    sendSuccess(res, 201, 'Bus created', bus);
  } catch (error) {
    next(error);
  }
};

exports.getBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOne({ _id: req.params.id, institution: req.user.institution })
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('route');
    if (!bus) return sendError(res, 404, 'Bus not found');
    sendSuccess(res, 200, 'Bus fetched', bus);
  } catch (error) {
    next(error);
  }
};

exports.updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true, runValidators: true }
    );
    if (!bus) return sendError(res, 404, 'Bus not found');
    sendSuccess(res, 200, 'Bus updated', bus);
  } catch (error) {
    next(error);
  }
};

exports.deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!bus) return sendError(res, 404, 'Bus not found');
    sendSuccess(res, 200, 'Bus deleted successfully');
  } catch (error) {
    next(error);
  }
};
