const mongoose = require('mongoose');
const Trip = require('./src/models/Trip');
const Route = require('./src/models/Route');
const Stop = require('./src/models/Stop');
const Bus = require('./src/models/Bus');
const Driver = require('./src/models/Driver');
const Institution = require('./src/models/Institution');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/school_bus_tracker', {
}).then(async () => {
  console.log('Connected to DB');
  const trips = await Trip.find().sort({ createdAt: -1 }).limit(1).populate('route');
  if (trips.length > 0) {
    const trip = trips[0];
    console.log('Latest Trip:');
    console.log('Trip ID:', trip._id);
    console.log('Trip Status:', trip.status);
    console.log('Trip Route ID:', trip.route ? trip.route._id : 'Null');
    if (trip.route) {
        console.log('Route name:', trip.route.name);
        console.log('Route stops length:', trip.route.stops ? trip.route.stops.length : 'Null');
    }
  } else {
    console.log('No trips found');
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
