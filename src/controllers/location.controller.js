const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const { sendSuccess, sendError } = require('../utils/response');

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return sendError(res, 400, 'Latitude and longitude are required.');
    }

    const driver = await Driver.findOne({ user: req.user.id, institution: req.user.institution });
    if (!driver) return sendError(res, 403, 'Unauthorized driver.');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeTrip = await Trip.findOne({ driver: driver._id, status: 'in_progress', date: { $gte: startOfDay } });
    
    if (!activeTrip) {
      return sendError(res, 400, 'No active trip exists or trip is completed.');
    }

    activeTrip.currentLocation = {
      latitude,
      longitude,
      timestamp: new Date()
    };
    activeTrip.lastUpdated = new Date();
    await activeTrip.save();

    sendSuccess(res, 200, 'Location updated successfully');
  } catch (error) {
    next(error);
  }
};
