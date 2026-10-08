const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDatabase } = require('../config/database');
const { getJwtSecret } = require('../middleware/authMiddleware');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roles = new Set(['buyer', 'vendor']);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function userResponse(user, vendor) {
  return {
    id: Number(user.id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    address: user.address,
    role: user.role,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    vendor: vendor
      ? {
          id: Number(vendor.id),
          storeName: vendor.store_name,
          storeDescription: vendor.store_description,
          status: vendor.status,
        }
      : null,
  };
}

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  );
}

function findVendor(userId) {
  return getDatabase()
    .prepare('SELECT id, store_name, store_description, status FROM vendors WHERE user_id = ?')
    .get(userId);
}

function register(req, res, next) {
  try {
    const name = clean(req.body.name);
    const phone = clean(req.body.phone);
    const email = clean(req.body.email).toLowerCase();
    const address = clean(req.body.address);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = clean(req.body.role) || 'buyer';
    const storeName = clean(req.body.storeName);
    const storeDescription = clean(req.body.storeDescription);

    if (!name || !phone || !email || !address || !password) {
      throw badRequest('Name, phone, email, address, and password are required');
    }
    if (!emailPattern.test(email)) {
      throw badRequest('A valid email address is required');
    }
    if (password.length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }
    if (!roles.has(role)) {
      throw badRequest('Role must be buyer or vendor');
    }
    if (role === 'vendor' && !storeName) {
      throw badRequest('Store name is required for vendor registration');
    }

    const database = getDatabase();
    if (database.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      throw badRequest('An account with this email already exists');
    }
    if (role === 'vendor' && database.prepare('SELECT id FROM vendors WHERE store_name = ?').get(storeName)) {
      throw badRequest('A store with this name already exists');
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    database.exec('BEGIN');

    try {
      const result = database
        .prepare('INSERT INTO users (name, phone, email, address, password, role) VALUES (?, ?, ?, ?, ?, ?)')
        .run(name, phone, email, address, passwordHash, role);
      const userId = Number(result.lastInsertRowid);

      if (role === 'vendor') {
        database
          .prepare('INSERT INTO vendors (user_id, store_name, store_description) VALUES (?, ?, ?)')
          .run(userId, storeName, storeDescription);
      }

      database.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
      database.exec('COMMIT');

      const user = database
        .prepare('SELECT id, name, phone, email, address, role, is_active, created_at FROM users WHERE id = ?')
        .get(userId);
      return res.status(201).json({ user: userResponse(user, findVendor(userId)) });
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return next(error);
  }
}

function login(req, res, next) {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw badRequest('Email and password are required');
    }

    const database = getDatabase();
    const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
    if (user.is_active !== 1) {
      const error = new Error('This account has been disabled');
      error.statusCode = 403;
      throw error;
    }

    return res.json({
      token: createToken(user),
      user: userResponse(user, findVendor(user.id)),
    });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  res.json({ user: userResponse(req.user, findVendor(req.user.id)) });
}

module.exports = {
  register,
  login,
  me,
};
