const Route = require('../models/Route');
const Stop = require('../models/Stop');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getRoutes = async (req, res, next) => {
  try {
    const baseQuery = { institution: req.user.institution, status: { $ne: 'inactive' } };
    let features = new ApiFeatures(Route.find(baseQuery).populate('bus driver stops'), req.query)
      .search(['name', 'routeNumber'])
      .paginate();

    features.searchFields = ['name', 'routeNumber'];
    await features.countTotal(Route, baseQuery);
    const routes = await features.query;

    res.status(200).json({
      success: true,
      data: routes,
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

exports.createRoute = async (req, res, next) => {
  try {
    const existing = await Route.findOne({ routeNumber: req.body.routeNumber });
    if (existing) return sendError(res, 400, 'Route number already exists');

    const route = await Route.create({ ...req.body, institution: req.user.institution });

    if (req.body.stops && Array.isArray(req.body.stops)) {
      for (let i = 0; i < req.body.stops.length; i++) {
        await Stop.findByIdAndUpdate(req.body.stops[i], { route: route._id, order: i });
      }
    }

    sendSuccess(res, 201, 'Route created', route);
  } catch (error) {
    next(error);
  }
};

exports.getRoute = async (req, res, next) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, institution: req.user.institution })
      .populate('stops bus');
    if (!route) return sendError(res, 404, 'Route not found');
    sendSuccess(res, 200, 'Route fetched', route);
  } catch (error) {
    next(error);
  }
};

exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      req.body,
      { new: true, runValidators: true }
    );
    if (!route) return sendError(res, 404, 'Route not found');

    if (req.body.stops && Array.isArray(req.body.stops)) {
      for (let i = 0; i < req.body.stops.length; i++) {
        await Stop.findByIdAndUpdate(req.body.stops[i], { route: route._id, order: i });
      }
    }

    sendSuccess(res, 200, 'Route updated', route);
  } catch (error) {
    next(error);
  }
};

exports.deleteRoute = async (req, res, next) => {
  try {
    const routeId = req.params.id;
    const route = await Route.findOneAndDelete({ _id: routeId, institution: req.user.institution });
    if (!route) return sendError(res, 404, 'Route not found');

    // Fix root cause: clear orphaned references in Bus when a Route is deleted
    const Bus = require('../models/Bus');
    await Bus.updateMany(
      { route: routeId, institution: req.user.institution },
      { $unset: { route: 1 } }
    );

    sendSuccess(res, 200, 'Route deleted successfully');
  } catch (error) {
    next(error);
  }
};
