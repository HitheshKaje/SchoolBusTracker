const Parent = require('../models/Parent');
const User = require('../models/User');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');
const crypto = require('crypto');

exports.getParents = async (req, res, next) => {
  try {
    const baseQuery = { status: { $ne: 'inactive' }, institution: req.user.institution };
    
    let features = new ApiFeatures(Parent.find(baseQuery).populate('user students'), req.query)
      .filter()
      .paginate();
      
    // Search by User name/mobile requires aggregation or separate queries. For simplicity, we skip deep search here or do simple regex.
    await features.countTotal(Parent, baseQuery);

    const parents = await features.query;

    res.status(200).json({
      success: true,
      data: parents,
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

exports.createParent = async (req, res, next) => {
  try {
    const { name, mobile, email, address, emergencyContact, countryCode, password } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ mobile });
    if (!user) {
      if (!password) {
         return sendError(res, 400, 'Password is required to create a new user');
      }
      user = await User.create({
        name,
        mobile,
        email,
        password,
        role: 'Parent',
        institution: req.user.institution
      });
    }

    const secretCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const parent = await Parent.create({
      user: user._id,
      address,
      emergencyContact,
      countryCode,
      secretCode,
      institution: req.user.institution
    });

    sendSuccess(res, 201, 'Parent created successfully. SMS placeholder sent.', parent);
  } catch (error) {
    next(error);
  }
};

exports.getParent = async (req, res, next) => {
  try {
    const parent = await Parent.findOne({ _id: req.params.id, institution: req.user.institution })
      .populate('user students');
    if (!parent) return sendError(res, 404, 'Parent not found');
    sendSuccess(res, 200, 'Parent fetched successfully', parent);
  } catch (error) {
    next(error);
  }
};

exports.updateParent = async (req, res, next) => {
  try {
    const { name, mobile, email, address, emergencyContact, countryCode } = req.body;
    const parent = await Parent.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!parent) return sendError(res, 404, 'Parent not found');

    if (name || mobile || email) {
      const updateData = {};
      if (name) updateData.name = name;
      if (mobile) updateData.mobile = mobile;
      if (email !== undefined) updateData.email = email;
      await User.findByIdAndUpdate(parent.user, updateData);
    }

    const parentUpdate = {};
    if (address) parentUpdate.address = address;
    if (emergencyContact) parentUpdate.emergencyContact = emergencyContact;
    if (countryCode) parentUpdate.countryCode = countryCode;

    const updatedParent = await Parent.findByIdAndUpdate(parent._id, parentUpdate, { new: true, runValidators: true });
    sendSuccess(res, 200, 'Parent updated successfully', updatedParent);
  } catch (error) {
    next(error);
  }
};

exports.deleteParent = async (req, res, next) => {
  try {
    const parent = await Parent.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!parent) return sendError(res, 404, 'Parent not found');
    
    // Also delete the associated User to fully remove the parent
    if (parent.user) {
      const User = require('../models/User');
      await User.findByIdAndDelete(parent.user);
    }
    
    sendSuccess(res, 200, 'Parent deleted successfully');
  } catch (error) {
    next(error);
  }
};
