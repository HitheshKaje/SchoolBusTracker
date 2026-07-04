const mongoose = require('mongoose');
const Bus = require('./src/models/Bus');
const Route = require('./src/models/Route');

mongoose.connect('mongodb://localhost:27017/school_bus_tracker', {
}).then(async () => {
  console.log('Connected to DB');
  
  // Find all buses with a route reference
  const busesWithRoutes = await Bus.find({ route: { $ne: null } });
  let fixedCount = 0;
  
  for (const bus of busesWithRoutes) {
      // Check if the referenced route exists
      const route = await Route.findById(bus.route);
      if (!route) {
          console.log(`Orphan detected: Bus ${bus.registrationNumber} (${bus._id}) points to missing Route ${bus.route}. Clearing...`);
          bus.route = undefined; // Safely unset the field
          await bus.save();
          fixedCount++;
      }
  }
  
  console.log(`Cleanup complete. Fixed ${fixedCount} orphaned bus->route references.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
