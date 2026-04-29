const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const logRoutes = require('./routes/logs');
app.use('/api/logs', logRoutes);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.set('strictQuery', true);

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

// Initialize connection
connectDB();

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectDB(); 
    const { username, password } = req.body;
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ username, password });
    await user.save();
    res.json({ msg: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOGS ROUTES ---

// GET: Fetch all logs for the logged-in user
app.get('/api/logs/all', async (req, res) => {
  try {
    await connectDB();
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const logs = await DailyLog.find({ userId: decoded.id }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Sync/Save daily log
app.post('/api/logs/daily', async (req, res) => {
  try {
    await connectDB();
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the exact keys sent from dashboard.js
    const { date, salah, sleepHours, productivityPercentage } = req.body;

    const log = await DailyLog.findOneAndUpdate(
      { userId: decoded.id, date: date },
      { 
        salah,           // Matches { fajr, dhuhr, etc. }
        sleepHours,      // Corrected name
        productivityPercentage // Corrected name
      },
      { upsert: true, new: true,runValidators: true }
    );

    res.json(log);
  } catch (err) {
    console.error("Sync Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- SERVE FRONTEND ---
// Static files must come AFTER API routes
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;