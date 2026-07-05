const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to get authenticated parent's profile
const getParentProfile = async (userId, institutionId) => {
  return await Parent.findOne({ user: userId, institution: institutionId, status: 'active' }).populate('user');
};

exports.getDashboard = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false, status: 'active' })
      .populate({
        path: 'assignedBus',
        populate: {
          path: 'route'
        }
      });
      
    const studentsCount = students.length;

    const busIds = [...new Set(students.map(s => s.assignedBus?._id?.toString()).filter(Boolean))];
    const routeIds = [...new Set(students.map(s => s.assignedBus?.route?._id?.toString()).filter(Boolean))];

    const unreadNotifications = await Notification.countDocuments({ recipient: req.user._id, readStatus: false });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activeTripsCount = await Trip.countDocuments({ bus: { $in: busIds }, status: 'in_progress', date: { $gte: startOfDay } });
    const completedTripsCount = await Trip.countDocuments({ bus: { $in: busIds }, status: 'completed', date: { $gte: startOfDay } });

    let currentTripStatus = 'No Active Trip';
    let activeTrip = null;

    if (activeTripsCount > 0) {
      currentTripStatus = 'In Progress';
      activeTrip = await Trip.findOne({ bus: { $in: busIds }, status: 'in_progress', date: { $gte: startOfDay } })
        .populate({ path: 'driver', populate: { path: 'user' } })
        .populate('bus')
        .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });
    } else if (completedTripsCount > 0) {
      currentTripStatus = 'Completed';
      activeTrip = await Trip.findOne({ bus: { $in: busIds }, status: 'completed', date: { $gte: startOfDay } })
        .sort({ endTime: -1 })
        .populate({ path: 'driver', populate: { path: 'user' } })
        .populate('bus')
        .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });
    }

    sendSuccess(res, 200, 'Parent dashboard fetched successfully', {
      profile: parent,
      studentsCount,
      busCount: busIds.length,
      routeCount: routeIds.length,
      currentTripStatus,
      activeTrip,
      unreadNotifications
    });
  } catch (error) {
    next(error);
  }
};

exports.getChildren = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false })
      .populate({
        path: 'assignedBus',
        populate: [
          { path: 'driver', populate: { path: 'user' } },
          { path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } }
        ]
      })
      .populate({ path: 'assignedRoute', populate: { path: 'stops', options: { sort: { order: 1 } } } })
      .populate('pickupStop')
      .populate('dropoffStop');

    sendSuccess(res, 200, 'Children fetched successfully', students);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedBuses = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false });
    const busIds = [...new Set(students.map(s => s.assignedBus?.toString()).filter(Boolean))];

    const buses = await Bus.find({ _id: { $in: busIds }, institution: req.user.institution })
      .populate('route')
      .populate({ path: 'driver', populate: { path: 'user' } });

    sendSuccess(res, 200, 'Assigned buses fetched successfully', buses);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedRoutes = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false });
    const busIds = [...new Set(students.map(s => s.assignedBus?.toString()).filter(Boolean))];

    const buses = await Bus.find({ _id: { $in: busIds }, institution: req.user.institution });
    const routeIds = [...new Set(buses.map(b => b.route?.toString()).filter(Boolean))];

    const routes = await Route.find({ _id: { $in: routeIds }, institution: req.user.institution }).populate({ path: 'stops', options: { sort: { order: 1 } } });

    sendSuccess(res, 200, 'Assigned routes fetched successfully', routes);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedDrivers = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false });
    const busIds = [...new Set(students.map(s => s.assignedBus?.toString()).filter(Boolean))];

    const drivers = await Driver.find({ assignedBus: { $in: busIds }, status: 'active', institution: req.user.institution }).populate('user');

    sendSuccess(res, 200, 'Assigned drivers fetched successfully', drivers);
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({
      institution: req.user.institution,
      targetAudience: { $in: ['All', 'Parent'] }
    }).lean();

    const notifications = await Notification.find({
      recipient: req.user._id
    }).lean();

    const mappedNotifications = notifications.map(n => ({
      ...n,
      message: n.body
    }));

    const combined = [...announcements, ...mappedNotifications].sort((a, b) => b.createdAt - a.createdAt);

    sendSuccess(res, 200, 'Notifications fetched successfully', combined);
  } catch (error) {
    next(error);
  }
};

exports.getTripHistory = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false });
    const busIds = [...new Set(students.map(s => s.assignedBus?.toString()).filter(Boolean))];

    const trips = await Trip.find({
      bus: { $in: busIds },
      status: 'completed',
      institution: req.user.institution
    })
    .populate({ path: 'driver', populate: { path: 'user' } })
    .populate('bus')
    .populate('route')
    .sort({ endTime: -1 })
    .limit(20);

    sendSuccess(res, 200, 'Trip history fetched successfully', trips);
  } catch (error) {
    next(error);
  }
};

exports.getLiveLocation = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');

    const students = await Student.find({ parents: parent._id, isDeleted: false });
    const busIds = [...new Set(students.map(s => s.assignedBus?.toString()).filter(Boolean))];

    if (busIds.length === 0) {
      return res.status(200).json({ success: false, message: 'No active trip' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const trip = await Trip.findOne({
      bus: { $in: busIds },
      status: 'in_progress',
      date: { $gte: startOfDay },
      institution: req.user.institution
    })
    .populate({ path: 'driver', populate: { path: 'user' } })
    .populate('bus')
    .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });

    if (!trip) {
      return res.status(200).json({ success: false, message: 'No active trip' });
    }

    const Location = require('../models/Location');
    const latestLocation = await Location.findOne({ trip: trip._id })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestLocation) {
      return res.status(200).json({ success: false, message: 'Location not available' });
    }
    
    trip.currentLocation = {
       latitude: latestLocation.location.coordinates[1],
       longitude: latestLocation.location.coordinates[0],
       timestamp: latestLocation.timestamp,
       speed: latestLocation.speed || 0
    };

    return res.status(200).json({
      success: true,
      data: {
        status: 'in_progress',
        trip: trip
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const parent = await getParentProfile(req.user.id, req.user.institution);
    if (!parent) return sendError(res, 404, 'Parent profile not found');
    sendSuccess(res, 200, 'Profile fetched successfully', parent);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { email, password, address, emergencyContact, countryCode, profilePhoto } = req.body;
    
    const userToUpdate = {};
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password; 
    if (profilePhoto) userToUpdate.profilePhoto = profilePhoto;

    if (Object.keys(userToUpdate).length > 0) {
      const u = await User.findById(req.user.id);
      if (email) u.email = email;
      if (password) u.password = password;
      if (profilePhoto) u.profilePhoto = profilePhoto;
      await u.save(); // hooks will hash password
    }

    const parentToUpdate = {};
    if (address) parentToUpdate.address = address;
    if (emergencyContact) parentToUpdate.emergencyContact = emergencyContact;
    if (countryCode) parentToUpdate.countryCode = countryCode;

    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id, institution: req.user.institution },
      parentToUpdate,
      { new: true, runValidators: true }
    ).populate('user');

    sendSuccess(res, 200, 'Profile updated successfully', parent);
  } catch (error) {
    next(error);
  }
};
