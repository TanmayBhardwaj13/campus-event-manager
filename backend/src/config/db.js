const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = (process.env.MONGODB_URI || '').trim().replace(/^["']|["']$/g, '');
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.replace('MONGODB_URI=', '').trim().replace(/^["']|["']$/g, '');
    }
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
