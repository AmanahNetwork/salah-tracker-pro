const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path'); // Added path
require('dotenv').config();

const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

app.use(express.json());
app.use(cors()); 

mongoose.connect(process.env.MONGO_URI);

// --- AUTH MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; 
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
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
app.get('/api/logs/all', auth, async (req, res) => {
  try {
    const logs = await DailyLog.find({ userId: req.user }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs/daily', auth, async (req, res) => {
  try {
    const { salah, sleepHours, productivityPercentage, date } = req.body;
    const log = await DailyLog.findOneAndUpdate(
      { userId: req.user, date: date },
      { salah, sleepHours, productivityPercentage },
      { upsert: true, new: true }
    );
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVE FRONTEND (CRITICAL PLACEMENT) ---

// 1. Serve static files from the React build folder
app.use(express.static('client/build'));

// 2. The "Catch-all" handler for React Routing
// This MUST be the last route before module.exports
app.get('*', (req, res) => {
  res.sendFile(path.resolve( 'client/build', 'index.html'));
});

module.exports = app;