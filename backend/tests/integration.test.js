const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_accessible_place_finder_2026';
const TEST_PORT = 5055;
const MONGO_PORT = 27019; // Use 27019 to avoid any lingering port conflict
const DB_PATH = path.resolve(__dirname, '..', 'test-data-db');

// Ensure test db directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Find local mongod.exe
const defaultMongodPath = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
const mongodPath = fs.existsSync(defaultMongodPath) ? defaultMongodPath : 'mongod';

console.log('🧪 ====================================================');
console.log('🧪 Starting Accessible Place Finder Integration Tests');
console.log('🧪 ====================================================\n');

let mongodProc = null;
let serverInstance = null;

// Helper: HTTP request wrapper
const makeRequest = (method, endpoint, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (dataString) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: endpoint,
        method: method,
        headers: headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
};

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition, title) => {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`  ✅ [PASS] ${title}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  try {
    // 1. Launch local mongod process
    console.log(`⏳ Starting local MongoDB on port ${MONGO_PORT}...`);
    mongodProc = spawn(mongodPath, [
      '--dbpath', DB_PATH,
      '--port', String(MONGO_PORT),
      '--bind_ip', '127.0.0.1'
    ]);

    mongodProc.on('error', (err) => {
      console.error('mongod spawn error:', err);
    });

    mongodProc.stderr.on('data', (d) => {
      // console.error(`mongod stderr: ${d}`);
    });

    // Wait 3.5s for mongod to initialize
    await wait(3500);

    // Connect Mongoose
    const mongoUri = `mongodb://127.0.0.1:${MONGO_PORT}/apf_test_db`;
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected Mongoose to test database.');

    // 2. Start Express app on TEST_PORT
    const app = require('../server');
    serverInstance = app.listen(TEST_PORT);
    await wait(500);
    console.log(`✅ Test server running on http://127.0.0.1:${TEST_PORT}\n`);

    // Clean test DB
    const User = require('../models/User');
    const { Place } = require('../models/Place');
    const Review = require('../models/Review');
    const { Report } = require('../models/Report');
    await Promise.all([
      User.deleteMany({}),
      Place.deleteMany({}),
      Review.deleteMany({}),
      Report.deleteMany({})
    ]);

    // ==========================================
    // TEST GROUP 1: Health & Public Endpoints
    // ==========================================
    console.log('📋 Test Group 1: Server Health & Public APIs');
    const healthRes = await makeRequest('GET', '/api/health');
    assert(healthRes.statusCode === 200 && healthRes.body.status === 'healthy', 'Health check returns 200 healthy');

    const emptyPlacesRes = await makeRequest('GET', '/api/places');
    assert(emptyPlacesRes.statusCode === 200 && Array.isArray(emptyPlacesRes.body.places), 'GET /api/places returns array');

    // ==========================================
    // TEST GROUP 2: User Authentication & Security
    // ==========================================
    console.log('\n📋 Test Group 2: User Authentication & JWT Security');

    // 2.1 Register first user (automatically assigned admin)
    const adminRegRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Admin Tester',
      email: 'admin.test@example.com',
      password: 'AdminPassword123'
    });
    assert(adminRegRes.statusCode === 201 && adminRegRes.body.token, 'Register admin returns 201 with JWT token');
    assert(adminRegRes.body.user.role === 'admin', 'First registered user gets role: admin');
    const adminToken = adminRegRes.body.token;

    // 2.2 Register standard user
    const userRegRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Regular Tester',
      email: 'user.test@example.com',
      password: 'UserPassword123',
      accessibilityPreferences: ['wheelchair', 'ramps']
    });
    assert(userRegRes.statusCode === 201 && userRegRes.body.token, 'Register regular user returns 201 with JWT token');
    assert(userRegRes.body.user.role === 'user', 'Second user gets role: user');
    const userToken = userRegRes.body.token;

    // 2.3 Duplicate email registration should fail with 409
    const dupRegRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Duplicate Guy',
      email: 'user.test@example.com',
      password: 'UserPassword123'
    });
    assert(dupRegRes.statusCode === 409, 'Duplicate registration returns 409 Conflict');

    // 2.4 Login with valid credentials
    const loginSuccessRes = await makeRequest('POST', '/api/auth/login', {
      email: 'user.test@example.com',
      password: 'UserPassword123'
    });
    assert(loginSuccessRes.statusCode === 200 && loginSuccessRes.body.token, 'Login returns 200 with new JWT token');
    assert(!loginSuccessRes.body.user.password, 'Password hash is NOT leaked in login response');

    // 2.5 Login with invalid credentials
    const loginFailRes = await makeRequest('POST', '/api/auth/login', {
      email: 'user.test@example.com',
      password: 'WrongPassword!'
    });
    assert(loginFailRes.statusCode === 401, 'Invalid password returns 401 Unauthorized');

    // 2.6 Fetch authenticated profile (/api/auth/me)
    const meRes = await makeRequest('GET', '/api/auth/me', null, userToken);
    assert(meRes.statusCode === 200 && meRes.body.user.email === 'user.test@example.com', 'GET /api/auth/me retrieves user profile');

    // 2.7 Update profile
    const updateProfileRes = await makeRequest('PUT', '/api/users/profile', {
      name: 'Regular Tester Updated',
      accessibilityPreferences: ['wheelchair', 'ramps', 'elevators']
    }, userToken);
    assert(updateProfileRes.statusCode === 200 && updateProfileRes.body.user.name === 'Regular Tester Updated', 'PUT /api/users/profile updates user name');

    // ==========================================
    // TEST GROUP 3: Admin Place Management & Role Guard
    // ==========================================
    console.log('\n📋 Test Group 3: Place Management & Role-Based Authorization');

    // 3.1 Regular user attempting admin action should get 403 Forbidden
    const forbiddenPlaceRes = await makeRequest('POST', '/api/admin/places', {
      name: 'Hacker Place',
      category: 'Healthcare',
      description: 'Unauthorized creation attempt with invalid permissions',
      address: 'Nowhere St',
      city: 'Nowhere'
    }, userToken);
    assert(forbiddenPlaceRes.statusCode === 403, 'Regular user POST /api/admin/places returns 403 Forbidden');

    // 3.2 Admin creates Place 1: Fully accessible hospital
    const place1Res = await makeRequest('POST', '/api/admin/places', {
      name: 'St. Jude Comprehensive Hospital',
      category: 'Healthcare',
      description: 'Full service hospital with emergency ward and outpatient mobility facilities.',
      address: '100 Medical Center Way',
      city: 'Boston',
      wheelchairAccessible: true,
      rampAvailable: true,
      accessibleWashroom: true,
      elevatorAvailable: true,
      accessibleParking: true,
      additionalAccessibility: 'Double-width automated doors and tactile floor tracks.'
    }, adminToken);
    assert(place1Res.statusCode === 201 && place1Res.body.place._id, 'Admin creates Place 1 (Healthcare) returns 201');
    const place1Id = place1Res.body.place._id;

    // 3.3 Admin creates Place 2: Cafe with only ramp and washroom
    const place2Res = await makeRequest('POST', '/api/admin/places', {
      name: 'Blue Sky Artisan Bakery',
      category: 'Restaurant & Cafe',
      description: 'Charming neighborhood bakery with delicious gluten-free pastries and ground level access.',
      address: '42 Baker Street',
      city: 'Chicago',
      wheelchairAccessible: true,
      rampAvailable: true,
      accessibleWashroom: true,
      elevatorAvailable: false,
      accessibleParking: false
    }, adminToken);
    assert(place2Res.statusCode === 201 && place2Res.body.place._id, 'Admin creates Place 2 (Restaurant) returns 201');
    const place2Id = place2Res.body.place._id;

    // 3.4 Admin creates Place 3: Historic venue with NO wheelchair access
    const place3Res = await makeRequest('POST', '/api/admin/places', {
      name: 'Old Town Heritage Tower',
      category: 'Museum & Culture',
      description: 'Historic clock tower from 1880 with 80 winding spiral steps.',
      address: '1 Monument Square',
      city: 'Boston',
      wheelchairAccessible: false,
      rampAvailable: false,
      accessibleWashroom: false,
      elevatorAvailable: false,
      accessibleParking: false
    }, adminToken);
    assert(place3Res.statusCode === 201 && place3Res.body.place._id, 'Admin creates Place 3 returns 201');
    const place3Id = place3Res.body.place._id;

    // ==========================================
    // TEST GROUP 4: Search & Multi-Facility Filters
    // ==========================================
    console.log('\n📋 Test Group 4: Search & Multi-Facility Filters');

    // 4.1 Search by keyword "Hospital"
    const searchRes = await makeRequest('GET', '/api/places?q=Hospital');
    assert(searchRes.statusCode === 200 && searchRes.body.places.length === 1, 'Search q=Hospital matches 1 place');
    assert(searchRes.body.places[0].name.includes('Hospital'), 'Search result name contains Hospital');

    // 4.2 Filter by city "Boston"
    const cityRes = await makeRequest('GET', '/api/places?city=Boston');
    assert(cityRes.statusCode === 200 && cityRes.body.places.length === 2, 'Filter city=Boston returns 2 places');

    // 4.3 Filter by category "Healthcare"
    const catRes = await makeRequest('GET', '/api/places?category=Healthcare');
    assert(catRes.statusCode === 200 && catRes.body.places.length === 1, 'Filter category=Healthcare returns 1 place');

    // 4.4 Filter by elevator availability
    const elevatorRes = await makeRequest('GET', '/api/places?elevator=true');
    assert(elevatorRes.statusCode === 200 && elevatorRes.body.places.length === 1, 'Filter elevator=true returns only places with elevators');
    assert(elevatorRes.body.places[0]._id === place1Id, 'Only Place 1 has elevator=true');

    // 4.5 Filter by wheelchair=true AND parking=true
    const comboRes = await makeRequest('GET', '/api/places?wheelchair=true&parking=true');
    assert(comboRes.statusCode === 200 && comboRes.body.places.length === 1, 'Filter wheelchair=true&parking=true returns 1 matching place');

    // 4.6 Categories count endpoint
    const catSummaryRes = await makeRequest('GET', '/api/places/categories');
    assert(catSummaryRes.statusCode === 200 && Array.isArray(catSummaryRes.body.categories), 'GET /api/places/categories returns category breakdown');

    // 4.7 Cities list endpoint
    const citiesRes = await makeRequest('GET', '/api/places/cities');
    assert(citiesRes.statusCode === 200 && citiesRes.body.cities.includes('Boston') && citiesRes.body.cities.includes('Chicago'), 'GET /api/places/cities returns distinct cities');

    // ==========================================
    // TEST GROUP 5: Reviews, Ratings & Aggregates
    // ==========================================
    console.log('\n📋 Test Group 5: Reviews & Automatic Rating Aggregates');

    // 5.1 Regular user submits review with rating 5
    const reviewRes = await makeRequest('POST', `/api/places/${place1Id}/reviews`, {
      rating: 5,
      comment: 'Superb accessibility and kind staff! Automated doors worked flawlessly.',
      facilityFeedback: { wheelchairAccessible: true, rampAvailable: true }
    }, userToken);
    assert(reviewRes.statusCode === 201 && reviewRes.body.review.rating === 5, 'User submits 5-star review returns 201');

    // 5.2 Verify place averageRating is updated to 5.0 and reviewCount is 1
    const place1Check = await makeRequest('GET', `/api/places/${place1Id}`);
    assert(place1Check.statusCode === 200, 'GET /api/places/:id returns 200');
    assert(place1Check.body.place.averageRating === 5 && place1Check.body.place.reviewCount === 1, 'Place averageRating is updated to 5.0 and reviewCount to 1');

    // 5.3 User updates their own review to 4 stars
    const reviewUpdateRes = await makeRequest('POST', `/api/places/${place1Id}/reviews`, {
      rating: 4,
      comment: 'Updated review: mostly great, but morning elevator queue was long.'
    }, userToken);
    assert(reviewUpdateRes.statusCode === 200, 'Submitting second review updates existing review with 200 OK');

    // 5.4 Check place averageRating updated to 4.0
    const place1Check2 = await makeRequest('GET', `/api/places/${place1Id}`);
    assert(place1Check2.body.place.averageRating === 4 && place1Check2.body.place.reviewCount === 1, 'Place averageRating recalculated to 4.0');

    // 5.5 Check my-reviews endpoint
    const myReviewsRes = await makeRequest('GET', '/api/users/my-reviews', null, userToken);
    assert(myReviewsRes.statusCode === 200 && myReviewsRes.body.reviews.length === 1, 'GET /api/users/my-reviews returns user review');

    // ==========================================
    // TEST GROUP 6: Inaccuracy Reports & Admin Resolution
    // ==========================================
    console.log('\n📋 Test Group 6: Accessibility Inaccuracy Reports');

    // 6.1 Submit report for Place 3 (missing ramp)
    const reportRes = await makeRequest('POST', `/api/places/${place3Id}/reports`, {
      issueType: 'Facility Missing',
      facilityAffected: 'Ramp',
      description: 'The front steps lack an accessible ramp or lift for wheelchair users.',
      reporterName: 'Concerned Citizen',
      reporterEmail: 'citizen@example.com'
    });
    assert(reportRes.statusCode === 201 && reportRes.body.report._id, 'Public report submission returns 201');
    const reportId = reportRes.body.report._id;
    assert(reportRes.body.report.status === 'pending', 'New report status defaults to pending');

    // 6.2 Admin lists reports
    const adminReportsRes = await makeRequest('GET', '/api/admin/reports', null, adminToken);
    assert(adminReportsRes.statusCode === 200 && adminReportsRes.body.reports.length === 1, 'Admin GET /api/admin/reports returns reports list');

    // 6.3 Admin updates report status to resolved
    const resolveRes = await makeRequest('PATCH', `/api/admin/reports/${reportId}`, {
      status: 'resolved',
      adminNotes: 'Contacted landmark historical board. Portable ramp approved for installation.'
    }, adminToken);
    assert(resolveRes.statusCode === 200 && resolveRes.body.report.status === 'resolved', 'Admin PATCH /api/admin/reports/:id marks report as resolved');

    // ==========================================
    // TEST GROUP 7: Admin Statistics & Place Deletion Cascade
    // ==========================================
    console.log('\n📋 Test Group 7: Admin KPI Statistics & Deletion Cascade');

    // 7.1 Admin dashboard stats
    const statsRes = await makeRequest('GET', '/api/admin/stats', null, adminToken);
    assert(statsRes.statusCode === 200, 'GET /api/admin/stats returns 200');
    assert(statsRes.body.stats.totalPlaces === 3, 'Stats shows totalPlaces === 3');
    assert(statsRes.body.stats.totalUsers === 2, 'Stats shows totalUsers === 2');
    assert(statsRes.body.stats.totalReviews === 1, 'Stats shows totalReviews === 1');
    assert(statsRes.body.stats.resolvedReports === 1, 'Stats shows resolvedReports === 1');

    // 7.2 Admin deletes place 3 (cascades reports)
    const deletePlaceRes = await makeRequest('DELETE', `/api/admin/places/${place3Id}`, null, adminToken);
    assert(deletePlaceRes.statusCode === 200, 'DELETE /api/admin/places/:id returns 200');

    const placeAfterDelete = await makeRequest('GET', `/api/places/${place3Id}`);
    assert(placeAfterDelete.statusCode === 404, 'Deleted place returns 404 Not Found');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedCount} / ${totalCount} INTEGRATION TESTS PASSED PERFECTLY!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Integration test run failed:', error);
    process.exitCode = 1;
  } finally {
    // Teardown
    console.log('🧹 Tearing down test resources...');
    if (serverInstance) {
      serverInstance.close();
    }
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongodProc) {
      mongodProc.kill('SIGINT');
      try {
        process.kill(mongodProc.pid);
      } catch (e) {}
    }
    await wait(1000);
    // Cleanup test data directory
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.rmSync(DB_PATH, { recursive: true, force: true });
      }
    } catch (e) {}
    console.log('🏁 Teardown completed.');
    process.exit(process.exitCode || 0);
  }
}

runTests();
