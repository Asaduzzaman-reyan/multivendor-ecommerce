function errorMiddleware(error, _req, res, _next) {
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
}

module.exports = errorMiddleware;
