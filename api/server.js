const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();

const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION HELPER ---
let isConnected = false; // Track connection status

const connectDB = async () => {
  mongoose.set('strictQuery', true);
  
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    throw err;
  }
};

// --- AUTH ROUTES ---
app.post('/auth/register', async (req, res) => {
  try {
    await connectDB(); // Ensure DB is connected before query
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

app.post('/auth/login', async (req, res) => {
  try {
    await connectDB(); // Ensure DB is connected before query
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
app.get('/logs/all', async (req, res) => {
  try {
    await connectDB();
    // (Add your auth middleware check here as needed)
    const logs = await DailyLog.find({ userId: req.user }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... Keep your other routes but add `await connectDB();` at the start of each

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

module.exports = app;