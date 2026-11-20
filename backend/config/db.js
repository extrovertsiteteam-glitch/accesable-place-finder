const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI environment variable missing');
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    }).then((conn) => {
      console.log(`✅ MongoDB Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }).catch((error) => {
      cachedPromise = null;
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      throw error;
    });
  }

  return cachedPromise;
};

module.exports = connectDB;
