const Trip = require('../models/Trip');
const Stop = require('../models/Stop');

exports.startSimulation = async (tripId, routeId, io) => {
  try {
    const stops = await Stop.find({ route: routeId }).sort({ order: 1 });
    if (!stops || stops.length < 2) {
      console.error(`Simulation failed: Route ${routeId} has fewer than 2 stops.`);
      return;
    }

    const points = [];
    const stepsPerSegment = 10;

    for (let i = 0; i < stops.length - 1; i++) {
      const start = stops[i].location.coordinates; // [longitude, latitude]
      const end = stops[i+1].location.coordinates;
      
      const startJ = (i === 0) ? 0 : 1;
      for (let j = startJ; j <= stepsPerSegment; j++) {
        const lon = start[0] + (end[0] - start[0]) * (j / stepsPerSegment);
        const lat = start[1] + (end[1] - start[1]) * (j / stepsPerSegment);
        points.push({ longitude: lon, latitude: lat });
      }
    }

    let currentIndex = 0;
    
    // 3 second interval
    const intervalId = setInterval(async () => {
      try {
        if (currentIndex >= points.length) {
          clearInterval(intervalId);
          // Destination reached
          const trip = await Trip.findById(tripId);
          if (trip && trip.status === 'in_progress') {
            trip.status = 'completed';
            trip.endTime = new Date();
            await trip.save();
            if (io) io.emit('tripEnded', { tripId: trip._id, busId: trip.bus });
            console.log(`Trip ${tripId} automatically completed by simulator.`);
          }
          return;
        }
        
        const trip = await Trip.findById(tripId);
        if (!trip || trip.status !== 'in_progress') {
          // Trip was manually ended or cancelled
          clearInterval(intervalId);
          return;
        }

        const pt = points[currentIndex];
        trip.currentLocation = {
          latitude: pt.latitude,
          longitude: pt.longitude,
          accuracy: 15,
          timestamp: new Date()
        };
        trip.lastUpdated = new Date();
        
        await trip.save();
        
        if (io) {
          io.emit('locationUpdate', { 
            tripId: trip._id, 
            busId: trip.bus, 
            location: trip.currentLocation 
          });
        }
        
        currentIndex++;
      } catch (err) {
        console.error('Error during simulation tick:', err);
        clearInterval(intervalId);
      }
    }, 3000);
    
    console.log(`Started simulation for Trip ${tripId} with ${points.length} GPS points.`);
  } catch (error) {
    console.error('Failed to start trip simulation:', error);
  }
};
