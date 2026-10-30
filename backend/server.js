require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing from .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
    })
    .catch((error) => {
        console.error('❌ MongoDB Connection Error:', error.message);
    });

// API Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/student', require('./src/routes/student'));
app.use('/api/host', require('./src/routes/host'));
app.use('/api/public', require('./src/routes/public'));

// API health check
app.get('/api', (req, res) => {
    res.json({
        message: 'Campus Event Manager API is running',
        version: '1.0.0',
        status: 'ok'
    });
});

// Serve frontend for any non-API route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend:    http://localhost:${PORT}/admin/login.html`);
    console.log(`🌐 Student:     http://localhost:${PORT}/student/login.html`);
    console.log(`🌐 Host:        http://localhost:${PORT}/host/login.html`);
});
