/**
 * Rate Limiting Middleware
 * Uses express-rate-limit if installed, with a built-in memory sliding window limiter fallback
 */

let expressRateLimit;
try {
  expressRateLimit = require('express-rate-limit');
} catch (e) {
  expressRateLimit = null;
}

// In-memory fallback rate limiter
const createMemoryRateLimiter = (options) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || { success: false, message: 'Too many requests. Please slow down.' };
  const requests = new Map();

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter((time) => now - time < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= max) {
      return res.status(429).json(message);
    }

    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    next();
  };
};

const createLimiter = (options) => {
  if (expressRateLimit) {
    return expressRateLimit(options);
  }
  return createMemoryRateLimiter(options);
};

/**
 * Rate limiter for authentication routes (login / register)
 * 30 attempts per 15 minutes
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

/**
 * Rate limiter for reporting inaccuracies
 * 20 submissions per hour
 */
const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'You have submitted too many reports recently. Please try again in an hour.'
  }
});

/**
 * General API rate limiter
 */
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please slow down.'
  }
});

module.exports = {
  authLimiter,
  reportLimiter,
  apiLimiter
};
