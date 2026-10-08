const cors = require('cors');
const express = require('express');

const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');
const homeRoutes = require('./routes/homeRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();

app.disable('x-powered-by');
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', catalogRoutes);
app.use('/api', cartRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', paymentRoutes);
app.use('/api', orderRoutes);
app.use('/api', productRoutes);
app.use('/api', reviewRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', vendorRoutes);
app.use('/api', wishlistRoutes);
app.use('/api/home', homeRoutes);

app.use((_req, _res, next) => {
  const error = new Error('Route not found');
  error.statusCode = 404;
  next(error);
});

app.use(errorMiddleware);

module.exports = app;
