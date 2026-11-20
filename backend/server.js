require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const placeRoutes = require('./routes/placeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.set('trust proxy', 1);

// Security Headers: Use helmet if available, or set standard secure headers
try {
  const helmet = require('helmet');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false // Allow inline scripts/styles for frontend
    })
  );
} catch (e) {
  // Built-in standard security headers fallback
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during development for easy testing
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// 2. Serve frontend static assets directly from backend server for convenient single-server deployment
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rate Limiter for general API calls
app.use('/api', apiLimiter);

// Health check endpoint (always accessible even if MongoDB is not yet connected)
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'healthy',
    application: 'Accessible Place Finder API',
    database: dbConnected ? 'connected' : 'disconnected',
    databaseState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (e) {}
    }
    return next();
  }

  if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {}
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is not available. Please ensure MongoDB is running or configure your MongoDB Atlas URI in backend/.env',
      database: 'disconnected',
      help: 'Update MONGODB_URI in backend/.env to your MongoDB Atlas connection string.'
    });
  }
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all route to serve frontend index.html for non-API client routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const frontendPath = path.join(__dirname, '..', 'frontend', 'index.html');
  res.sendFile(frontendPath);
});

// Centralized error handling
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // Attempt database connection if not in standalone test mode
    if (process.env.NODE_ENV !== 'test') {
      try {
        await connectDB();
      } catch (dbErr) {
        console.warn('⚠️ Server starting without active MongoDB connection.');
        console.warn('   Update MONGODB_URI in backend/.env to connect to MongoDB Atlas.');
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Accessible Place Finder API Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🔗 Local Address:    http://localhost:${PORT}`);
      console.log(`📡 Health Check:     http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend Portal:  http://localhost:${PORT}/\n`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down Accessible Place Finder server...');
      server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
