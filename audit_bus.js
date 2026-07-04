const mongoose = require('mongoose');
const Bus = require('./src/models/Bus');
const Route = require('./src/models/Route');

mongoose.connect('mongodb://localhost:27017/school_bus_tracker', {
}).then(async () => {
  console.log('Connected to DB');
  console.log('--- AUDIT REPORT FOR BUS 3909 ---');
  
  // Find bus 3909
  const bus = await Bus.findOne({ registrationNumber: { $regex: '3909', $options: 'i' } });
  
  if (!bus) {
      console.log('Bus 3909 not found');
  } else {
      console.log('1. Bus Document found:', bus.registrationNumber);
      console.log('2. bus.route value:', bus.route);
      
      if (bus.route) {
          const route = await Route.findById(bus.route);
          console.log('3. Route document exists?:', route ? 'Yes' : 'No');
          console.log('4. Route ObjectId valid?: Yes (Valid Mongoose ObjectId format)');
          
          if (route) {
              console.log('Route Name:', route.name);
          } else {
              console.log('--> CONCLUSION: STALE REFERENCE DETECTED! Bus points to a deleted Route.');
          }
      } else {
          console.log('bus.route is null/undefined. No assignment present.');
      }
  }
  
  console.log('\n--- SYSTEM WIDE ORPHAN CHECK ---');
  // Find all buses with routes that don't exist
  const allBusesWithRoutes = await Bus.find({ route: { $ne: null } });
  for (const b of allBusesWithRoutes) {
      const r = await Route.findById(b.route);
      if (!r) {
          console.log(`Orphan detected: Bus ${b.registrationNumber} points to missing Route ${b.route}`);
      }
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
