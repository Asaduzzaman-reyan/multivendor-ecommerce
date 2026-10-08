const jwt = require('jsonwebtoken');

const { getDatabase } = require('../config/database');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    const error = new Error('JWT_SECRET must be configured with at least 16 characters');
    error.statusCode = 500;
    throw error;
  }

  return secret;
}

function authenticate(req, _res, next) {
  const authorization = req.get('authorization');
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = getDatabase()
      .prepare('SELECT id, name, phone, email, address, role, is_active, created_at FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user || user.is_active !== 1) {
      const error = new Error('User account is unavailable');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired token';
    }

    return next(error);
  }
}

function optionalAuthenticate(req, _res, next) {
  const authorization = req.get('authorization');
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) return next();

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = getDatabase()
      .prepare('SELECT id, name, phone, email, address, role, is_active, created_at FROM users WHERE id = ?')
      .get(payload.sub);
    if (user && user.is_active === 1) req.user = user;
    return next();
  } catch (_error) {
    return next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  getJwtSecret,
};
