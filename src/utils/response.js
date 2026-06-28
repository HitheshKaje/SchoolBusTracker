exports.sendSuccess = (res, statusCode, message, data = {}, pagination = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

exports.sendError = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
