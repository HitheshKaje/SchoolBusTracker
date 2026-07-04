const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    if (err.keyValue) {
      const fields = Object.keys(err.keyValue);
      const formattedFields = fields.map(field => {
        if (field === 'mobile') return 'Mobile number';
        if (field === 'email') return 'Email';
        if (field === 'institution') return 'Institution';
        if (field === 'osmId') return 'OSM ID';
        return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim();
      });
      
      if (formattedFields.length > 1) {
        const last = formattedFields.pop();
        message = formattedFields.join(', ') + ' and ' + last + ' already exist.';
      } else {
        message = formattedFields[0] + ' already exists.';
      }
    } else {
      message = 'Duplicate field value entered';
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  sendError(res, statusCode, message);
};

module.exports = errorHandler;
