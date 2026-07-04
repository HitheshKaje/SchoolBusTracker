const mongoose = require('mongoose');
const Trip = require('./src/models/Trip');

mongoose.connect('mongodb://localhost:27017/school_bus_tracker', {
}).then(async () => {
  console.log('Connected to DB');
  
  // ONLY delete trips where the route is missing (null) - this is the corrupted data
  // that was generated before the deep population fix.
  const result = await Trip.deleteMany({ route: null });
  
  console.log('Deleted corrupted trips:', result.deletedCount);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
