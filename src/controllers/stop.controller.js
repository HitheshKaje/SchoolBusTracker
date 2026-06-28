const Stop = require('../models/Stop');
const Route = require('../models/Route');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getStops = async (req, res, next) => {
  try {
    const baseQuery = { institution: req.user.institution };
    if (req.query.route) {
      baseQuery.route = req.query.route;
    }

    let features = new ApiFeatures(Stop.find(baseQuery).populate('route'), req.query)
      .filter()
      .search(['name'])
      .sort()
      .paginate();

    features.searchFields = ['name'];
    await features.countTotal(Stop, baseQuery);

    const stops = await features.query;

    sendSuccess(res, 200, 'Stops fetched', stops, {
      total: features.totalDocuments,
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10
    });
  } catch (error) {
    next(error);
  }
};

exports.createStop = async (req, res, next) => {
  try {
    const { name, route, latitude, longitude, arrivalTime, order } = req.body;
    
    const stopData = {
      institution: req.user.institution,
      name,
      route,
      estimatedTime: arrivalTime,
      order: order ? parseInt(order, 10) : 0
    };

    if (latitude && longitude) {
      stopData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    } else {
      return sendError(res, 400, 'Latitude and longitude are required');
    }

    const stop = await Stop.create(stopData);

    // Add to Route stops array
    if (route) {
      await Route.findByIdAndUpdate(route, { $push: { stops: stop._id } });
    }

    sendSuccess(res, 201, 'Stop created', stop);
  } catch (error) {
    next(error);
  }
};

exports.getStop = async (req, res, next) => {
  try {
    const stop = await Stop.findOne({ _id: req.params.id, institution: req.user.institution }).populate('route');
    if (!stop) return sendError(res, 404, 'Stop not found');
    sendSuccess(res, 200, 'Stop fetched', stop);
  } catch (error) {
    next(error);
  }
};

exports.updateStop = async (req, res, next) => {
  try {
    const { name, route, latitude, longitude, arrivalTime, order } = req.body;
    
    const originalStop = await Stop.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!originalStop) return sendError(res, 404, 'Stop not found');
    
    const updateData = { name, route, estimatedTime: arrivalTime };
    if (order !== undefined) updateData.order = parseInt(order, 10) || 0;
    
    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }
    
    const stop = await Stop.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      updateData,
      { new: true }
    );
    
    // Manage route transition if route changed
    if (originalStop.route && route && originalStop.route.toString() !== route.toString()) {
      await Route.findByIdAndUpdate(originalStop.route, { $pull: { stops: stop._id } });
      await Route.findByIdAndUpdate(route, { $push: { stops: stop._id } });
    }

    sendSuccess(res, 200, 'Stop updated', stop);
  } catch (error) {
    next(error);
  }
};

exports.deleteStop = async (req, res, next) => {
  try {
    const stop = await Stop.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!stop) return sendError(res, 404, 'Stop not found');
    
    if (stop.route) {
      await Route.findByIdAndUpdate(stop.route, { $pull: { stops: stop._id } });
    }
    sendSuccess(res, 200, 'Stop deleted');
  } catch (error) {
    next(error);
  }
};
