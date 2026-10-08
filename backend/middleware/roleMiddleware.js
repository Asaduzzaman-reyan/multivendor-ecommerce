function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error('You do not have permission to access this resource');
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
}

function requireApprovedVendor(req, _res, next) {
  if (req.user.role !== 'vendor') {
    const error = new Error('Vendor access required');
    error.statusCode = 403;
    return next(error);
  }

  const { getDatabase } = require('../config/database');
  const vendor = getDatabase()
    .prepare('SELECT status FROM vendors WHERE user_id = ?')
    .get(req.user.id);

  if (!vendor || vendor.status !== 'approved') {
    const error = new Error('Vendor approval is required');
    error.statusCode = 403;
    return next(error);
  }

  return next();
}

module.exports = {
  requireRole,
  requireApprovedVendor,
};
