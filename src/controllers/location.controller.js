const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const { sendSuccess, sendError } = require('../utils/response');

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return sendError(res, 400, 'Latitude and longitude are required.');
    }

    const driver = await Driver.findOne({ user: req.user._id || req.user.id });
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

    const Location = require('../models/Location');
    await Location.create({
      institution: req.user.institution || driver.institution,
      trip: activeTrip._id,
      bus: activeTrip.bus,
      driver: driver._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // [lng, lat]
      },
      speed: 0,
      timestamp: activeTrip.currentLocation.timestamp
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('locationUpdate', { 
        tripId: activeTrip._id, 
        busId: activeTrip.bus, 
        location: activeTrip.currentLocation 
      });
    }

    sendSuccess(res, 200, 'Location updated successfully');
  } catch (error) {
    next(error);
  }
};
