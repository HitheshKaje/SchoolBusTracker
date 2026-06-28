const Driver = require('../models/Driver');
const User = require('../models/User');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getDrivers = async (req, res, next) => {
  try {
    const baseQuery = { status: { $ne: 'inactive' }, institution: req.user.institution };
    let features = new ApiFeatures(Driver.find(baseQuery).populate('user assignedBus assignedRoute'), req.query).paginate();
    await features.countTotal(Driver, baseQuery);
    const drivers = await features.query;

    res.status(200).json({
      success: true,
      data: drivers,
      pagination: {
        total: features.totalDocuments,
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createDriver = async (req, res, next) => {
  try {
    const { name, mobile, email, licenseNumber, licenseExpiry, experience } = req.body;
    
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({
        name,
        mobile,
        email,
        password: 'DriverPassword123',
        role: 'Driver',
        institution: req.user.institution
      });
    }

    const driver = await Driver.create({
      user: user._id,
      licenseNumber,
      licenseExpiry,
      experience,
      institution: req.user.institution
    });

    sendSuccess(res, 201, 'Driver created successfully', driver);
  } catch (error) {
    next(error);
  }
};

exports.getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, institution: req.user.institution })
      .populate('user assignedBus assignedRoute');
    if (!driver) return sendError(res, 404, 'Driver not found');
    sendSuccess(res, 200, 'Driver fetched successfully', driver);
  } catch (error) {
    next(error);
  }
};

exports.updateDriver = async (req, res, next) => {
  try {
    const { name, mobile, email, licenseNumber, licenseExpiry, experience } = req.body;
    const driver = await Driver.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!driver) return sendError(res, 404, 'Driver not found');

    if (name || mobile || email) {
      const updateData = {};
      if (name) updateData.name = name;
      if (mobile) updateData.mobile = mobile;
      if (email !== undefined) updateData.email = email;
      await User.findByIdAndUpdate(driver.user, updateData);
    }

    const driverUpdate = {};
    if (licenseNumber) driverUpdate.licenseNumber = licenseNumber;
    if (licenseExpiry) driverUpdate.licenseExpiry = licenseExpiry;
    if (experience !== undefined) driverUpdate.experience = experience;

    const updatedDriver = await Driver.findByIdAndUpdate(driver._id, driverUpdate, { new: true, runValidators: true });
    sendSuccess(res, 200, 'Driver updated', updatedDriver);
  } catch (error) {
    next(error);
  }
};

exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { status: 'inactive' }
    );
    if (!driver) return sendError(res, 404, 'Driver not found');
    sendSuccess(res, 200, 'Driver deleted (inactive)');
  } catch (error) {
    next(error);
  }
};
