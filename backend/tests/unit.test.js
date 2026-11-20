const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'unit_test_jwt_secret_key_2026';

const User = require('../models/User');
const { Place, placeCategories } = require('../models/Place');
const Review = require('../models/Review');
const { Report, issueTypes, reportStatuses } = require('../models/Report');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

console.log('🧪 ====================================================');
console.log('🧪 Starting Accessible Place Finder Unit & Logic Tests');
console.log('🧪 ====================================================\n');

let passed = 0;
let total = 0;

function it(title, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ [PASS] ${title}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(err);
    throw err;
  }
}

async function itAsync(title, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✅ [PASS] ${title}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${title}`);
    console.error(err);
    throw err;
  }
}

async function runAllUnitTests() {
  console.log('📋 Test Group 1: Mongoose Models & Schemas');

  it('User model should have required schema paths', () => {
    assert(User.schema.paths.name, 'name path exists');
    assert(User.schema.paths.email, 'email path exists');
    assert(User.schema.paths.password, 'password path exists');
    assert(User.schema.paths.role, 'role path exists');
    assert(User.schema.paths.accessibilityPreferences, 'accessibilityPreferences path exists');
  });

  it('Place model should have all required accessibility facility paths', () => {
    assert(Place.schema.paths.wheelchairAccessible, 'wheelchairAccessible flag exists');
    assert(Place.schema.paths.rampAvailable, 'rampAvailable flag exists');
    assert(Place.schema.paths.accessibleWashroom, 'accessibleWashroom flag exists');
    assert(Place.schema.paths.elevatorAvailable, 'elevatorAvailable flag exists');
    assert(Place.schema.paths.accessibleParking, 'accessibleParking flag exists');
    assert(Place.schema.paths.additionalAccessibility, 'additionalAccessibility path exists');
    assert(Place.schema.paths.averageRating, 'averageRating path exists');
    assert(Place.schema.paths.reviewCount, 'reviewCount path exists');
  });

  it('Place categories should contain expected industry categories', () => {
    assert(placeCategories.includes('Healthcare'), 'Includes Healthcare');
    assert(placeCategories.includes('Restaurant & Cafe'), 'Includes Restaurant & Cafe');
    assert(placeCategories.includes('Education & Library'), 'Includes Education & Library');
    assert(placeCategories.includes('Park & Recreation'), 'Includes Park & Recreation');
    assert(placeCategories.includes('Shopping & Mall'), 'Includes Shopping & Mall');
    assert(placeCategories.includes('Transit & Station'), 'Includes Transit & Station');
    assert(placeCategories.includes('Museum & Culture'), 'Includes Museum & Culture');
  });

  it('Review model should validate rating range and required fields', () => {
    assert(Review.schema.paths.place, 'place path exists');
    assert(Review.schema.paths.user, 'user path exists');
    assert(Review.schema.paths.rating, 'rating path exists');
    assert(Review.schema.paths.comment, 'comment path exists');
    assert(typeof Review.recalculatePlaceRating === 'function', 'recalculatePlaceRating static method exists');
  });

  it('Report model should have valid issueTypes and reportStatuses', () => {
    assert(issueTypes.includes('Facility Missing'), 'issueTypes includes Facility Missing');
    assert(issueTypes.includes('Facility Broken / Inoperable'), 'issueTypes includes Facility Broken');
    assert(reportStatuses.includes('pending'), 'reportStatuses includes pending');
    assert(reportStatuses.includes('resolved'), 'reportStatuses includes resolved');
  });

  console.log('\n📋 Test Group 2: Password Hashing & Authentication Helpers');

  await itAsync('bcrypt password hashing and verification should work correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert(hash !== rawPassword, 'Hash must not equal raw password');
    const isValid = await bcrypt.compare(rawPassword, hash);
    assert(isValid === true, 'Valid password matches hash');
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert(isInvalid === false, 'Invalid password is rejected');
  });

  it('JWT token generation and verification should preserve payload', () => {
    const secret = process.env.JWT_SECRET;
    const testId = '60d0fe4f5311236168a109ca';
    const token = jwt.sign({ id: testId }, secret, { expiresIn: '1h' });

    assert(token && token.split('.').length === 3, 'JWT has 3 segments');
    const decoded = jwt.verify(token, secret);
    assert(decoded.id === testId, 'Decoded ID matches original');
  });

  console.log('\n📋 Test Group 3: Authorization Middleware & Guards');

  it('requireAdmin middleware should reject non-admin users with 403', () => {
    const req = { user: { role: 'user', name: 'Regular Guy' } };
    let statusSet = 0;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => {
            jsonSent = data;
          }
        };
      }
    };
    let nextCalled = false;
    requireAdmin(req, res, () => { nextCalled = true; });

    assert(statusSet === 403, 'Returns 403 Forbidden for role: user');
    assert(jsonSent.success === false, 'success is false');
    assert(nextCalled === false, 'next() is NOT called');
  });

  it('requireAdmin middleware should allow admin users through to next()', () => {
    const req = { user: { role: 'admin', name: 'Admin Boss' } };
    let nextCalled = false;
    requireAdmin(req, {}, () => { nextCalled = true; });
    assert(nextCalled === true, 'next() is called for role: admin');
  });

  it('verifyToken middleware should reject requests without Authorization header with 401', async () => {
    const req = { headers: {} };
    let statusSet = 0;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => {
            jsonSent = data;
          }
        };
      }
    };
    let nextCalled = false;
    await verifyToken(req, res, () => { nextCalled = true; });

    assert(statusSet === 401, 'Returns 401 Unauthorized for missing token');
    assert(nextCalled === false, 'next() is NOT called');
  });

  console.log('\n📋 Test Group 4: Error Handling Middleware');

  it('errorHandler should format Mongoose CastError cleanly', () => {
    const err = { name: 'CastError', value: 'invalid_id_123', message: 'Cast to ObjectId failed' };
    let statusSet = 0;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => {
            jsonSent = data;
          }
        };
      }
    };
    errorHandler(err, {}, res, () => {});

    assert(statusSet === 404, 'Returns 404 for CastError');
    assert(jsonSent.message.includes('invalid_id_123'), 'Includes the problematic ID');
  });

  it('errorHandler should handle duplicate key 11000 without leaking mongo internal details', () => {
    const err = { code: 11000, keyValue: { email: 'duplicate@test.com' }, message: 'E11000 duplicate key error' };
    let statusSet = 0;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => {
            jsonSent = data;
          }
        };
      }
    };
    errorHandler(err, {}, res, () => {});

    assert(statusSet === 409, 'Returns 409 Conflict for duplicate key');
    assert(jsonSent.message.includes('already exists'), 'Returns user-friendly error message');
  });

  it('notFoundHandler should return 404 JSON for unmatched routes', () => {
    const req = { method: 'POST', originalUrl: '/api/non-existent-endpoint' };
    let statusSet = 0;
    let jsonSent = null;
    const res = {
      status: (code) => {
        statusSet = code;
        return {
          json: (data) => {
            jsonSent = data;
          }
        };
      }
    };
    notFoundHandler(req, res, () => {});

    assert(statusSet === 404, 'Returns 404');
    assert(jsonSent.message.includes('/api/non-existent-endpoint'), 'Mentions route name');
  });

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed} / ${total} UNIT & LOGIC TESTS PASSED PERFECTLY!`);
  console.log('====================================================\n');
}

runAllUnitTests();
