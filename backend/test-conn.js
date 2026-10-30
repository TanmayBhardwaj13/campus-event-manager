require('dotenv').config();
const mongoose = require('mongoose');

console.log('URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ':***@') : 'NOT SET');

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ CONNECTED OK');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ FAILED:', e.message);
    process.exit(1);
  });
