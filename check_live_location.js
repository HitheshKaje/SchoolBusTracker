const mongoose = require('mongoose');
const Trip = require('./src/models/Trip');

mongoose.connect('mongodb://localhost:27017/school_bus_tracker', {
}).then(async () => {
  console.log('Connected to DB');
  
  const trip = await Trip.findOne({ status: 'in_progress' }).populate('route').populate('bus');
  if (!trip) {
      console.log('No active trip found in DB');
  } else {
      console.log('Active Trip ID:', trip._id);
      console.log('Bus ID:', trip.bus ? trip.bus.registrationNumber : 'Null');
      if (trip.route) {
          console.log('Route Name:', trip.route.name);
          console.log('Route Start:', trip.route.startPoint);
          console.log('Route End:', trip.route.endPoint);
          console.log('Route Distance:', trip.route.distance);
          console.log('Route Estimated Time:', trip.route.estimatedTime);
          console.log('Route Stops Count:', trip.route.stops ? trip.route.stops.length : 0);
      } else {
          console.log('Route: Null');
      }
      console.log('Current Location:', trip.currentLocation);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
