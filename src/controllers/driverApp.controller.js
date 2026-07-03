const Driver = require('../models/Driver');
const Parent = require('../models/Parent');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Stop = require('../models/Stop');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to get driver's own profile based on authenticated user
const getDriverProfile = async (userId, institutionId) => {
  return await Driver.findOne({ user: userId, institution: institutionId })
    .populate('user')
    .populate({
      path: 'assignedBus',
      populate: {
        path: 'route'
      }
    });
};

exports.getDashboard = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver) return sendError(res, 404, 'Driver profile not found');

    let stopsCount = 0;
    let assignedRoute = null;
    
    if (driver.assignedBus && driver.assignedBus.route) {
      assignedRoute = driver.assignedBus.route;
      stopsCount = await Stop.countDocuments({ route: assignedRoute._id, institution: req.user.institution });
    }

    let studentsCount = 0;
    if (driver.assignedBus) {
      studentsCount = await Student.countDocuments({ assignedBus: driver.assignedBus._id, institution: req.user.institution, isDeleted: false });
    }

    // Attach dynamically resolved route to the driver object for frontend compatibility
    const driverObj = driver.toObject();
    driverObj.assignedRoute = assignedRoute;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const tripsToday = await Trip.find({ driver: driver._id, date: { $gte: startOfDay } });
    const morningTrip = tripsToday.find(t => t.session === 'Morning');
    const eveningTrip = tripsToday.find(t => t.session === 'Evening');

    let currentTripStatus = 'NO_MORNING_TRIP';
    let tripDetails = null;

    if (!morningTrip) {
      currentTripStatus = 'NO_MORNING_TRIP';
    } else if (morningTrip.status === 'in_progress') {
      currentTripStatus = 'MORNING_RUNNING';
      tripDetails = morningTrip;
    } else if (morningTrip.status === 'completed' && !eveningTrip) {
      currentTripStatus = 'NO_EVENING_TRIP';
      tripDetails = morningTrip;
    } else if (eveningTrip && eveningTrip.status === 'in_progress') {
      currentTripStatus = 'EVENING_RUNNING';
      tripDetails = eveningTrip;
    } else if (eveningTrip && eveningTrip.status === 'completed') {
      currentTripStatus = 'ALL_COMPLETED';
      tripDetails = eveningTrip;
    }

    const data = {
      profile: driverObj,
      stopsCount,
      studentsCount,
      currentTripStatus,
      tripDetails
    };

    sendSuccess(res, 200, 'Driver dashboard fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedBus = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver || !driver.assignedBus) return sendSuccess(res, 200, 'No bus assigned', null);

    // driver.assignedBus is already populated, we can return it directly or fetch it fresh
    const bus = await Bus.findOne({ _id: driver.assignedBus._id, institution: req.user.institution });
    sendSuccess(res, 200, 'Assigned bus fetched successfully', bus);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedRoute = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    
    const assignedRoute = driver && driver.assignedBus ? driver.assignedBus.route : null;
    
    if (!driver || !assignedRoute) return sendSuccess(res, 200, 'No route assigned', null);

    const route = await Route.findOne({ _id: assignedRoute._id, institution: req.user.institution });
    const stops = await Stop.find({ route: route._id, institution: req.user.institution });

    sendSuccess(res, 200, 'Assigned route fetched successfully', { route, stops });
  } catch (error) {
    next(error);
  }
};

exports.getAssignedStudents = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver || !driver.assignedBus) return sendSuccess(res, 200, 'No bus assigned', []);

    const students = await Student.find({ assignedBus: driver.assignedBus._id, institution: req.user.institution, isDeleted: false })
      .populate('pickupStop')
      .populate('dropoffStop');
      
    sendSuccess(res, 200, 'Assigned students fetched successfully', students);
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    // Announcements for Driver or All
    const announcements = await Announcement.find({
      institution: req.user.institution,
      targetAudience: { $in: ['All', 'Driver'] }
    }).sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Notifications fetched successfully', announcements);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { email, password, profilePhoto } = req.body;
    
    const userToUpdate = {};
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password; // pre-save hook handles hashing
    if (profilePhoto) userToUpdate.profilePhoto = profilePhoto;

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, institution: req.user.institution },
      userToUpdate,
      { new: true, runValidators: true }
    );
    
    // Explicitly re-save to trigger bcrypt hash if password is updated
    if (password) {
      const u = await User.findById(req.user.id);
      u.password = password;
      await u.save();
    }

    sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

exports.startTrip = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver || !driver.assignedBus || !driver.assignedBus.route) {
      return sendError(res, 400, 'Driver must have an assigned bus and route to start a trip.');
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tripsToday = await Trip.find({ driver: driver._id, date: { $gte: startOfDay } });
    const activeTrip = tripsToday.find(t => t.status === 'in_progress');
    
    if (activeTrip) {
      return sendError(res, 400, 'A trip is already running.');
    }

    const morningTrip = tripsToday.find(t => t.session === 'Morning');
    const eveningTrip = tripsToday.find(t => t.session === 'Evening');

    if (morningTrip && eveningTrip) {
      return sendError(res, 400, 'All trips for today are completed.');
    }

    const session = !morningTrip ? 'Morning' : 'Evening';

    const newTrip = await Trip.create({
      institution: req.user.institution,
      route: driver.assignedBus.route._id,
      bus: driver.assignedBus._id,
      driver: driver._id,
      date: new Date(),
      session: session,
      status: 'in_progress',
      startTime: new Date()
    });

    // Notify Admins
    const admins = await User.find({ institution: req.user.institution, role: 'Admin' });
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      title: 'Trip Started',
      body: `Driver ${driver.user.name} has started today's trip.`,
      type: 'info'
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Notify Parents
    const assignedStudents = await Student.find({ assignedBus: driver.assignedBus._id, isDeleted: false, institution: req.user.institution });
    const parentIds = [...new Set(assignedStudents.flatMap(s => s.parents))];
    const parents = await Parent.find({ _id: { $in: parentIds }, status: 'active' });
    
    const parentNotifications = parents.map(p => ({
      recipient: p.user,
      title: 'Trip Started',
      body: `Your child's school bus has started today's trip.`,
      type: 'info'
    }));
    if (parentNotifications.length > 0) {
      await Notification.insertMany(parentNotifications);
    }

    sendSuccess(res, 200, 'Trip started successfully', newTrip);
  } catch (error) {
    next(error);
  }
};

exports.endTrip = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver) return sendError(res, 404, 'Driver not found.');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeTrip = await Trip.findOne({ driver: driver._id, status: 'in_progress', date: { $gte: startOfDay } });
    if (!activeTrip) {
      return sendError(res, 400, 'No active trip to end.');
    }

    activeTrip.endTime = new Date();
    activeTrip.status = 'completed';
    await activeTrip.save();

    // Notify Admins
    const admins = await User.find({ institution: req.user.institution, role: 'Admin' });
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      title: 'Trip Ended',
      body: `Driver ${driver.user.name} has completed today's trip.`,
      type: 'info'
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Notify Parents
    const assignedStudents = await Student.find({ assignedBus: driver.assignedBus._id, isDeleted: false, institution: req.user.institution });
    const parentIds = [...new Set(assignedStudents.flatMap(s => s.parents))];
    const parents = await Parent.find({ _id: { $in: parentIds }, status: 'active' });
    
    const parentNotifications = parents.map(p => ({
      recipient: p.user,
      title: 'Trip Completed',
      body: `Your child's school bus has completed today's trip.`,
      type: 'info'
    }));
    if (parentNotifications.length > 0) {
      await Notification.insertMany(parentNotifications);
    }

    sendSuccess(res, 200, 'Trip ended successfully', activeTrip);
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;
    
    if (!latitude || !longitude) {
      return sendError(res, 400, 'Latitude and longitude are required.');
    }

    const driver = await Driver.findOne({ user: req.user.id, institution: req.user.institution });
    if (!driver) return sendError(res, 404, 'Driver not found.');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeTrip = await Trip.findOne({ driver: driver._id, status: 'in_progress', date: { $gte: startOfDay } });
    
    if (activeTrip) {
      activeTrip.currentLocation = {
        latitude,
        longitude,
        accuracy: accuracy || 0,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      };
      activeTrip.lastUpdated = new Date();
      await activeTrip.save();
    }

    sendSuccess(res, 200, 'Location updated successfully');
  } catch (error) {
    next(error);
  }
};
