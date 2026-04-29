const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  // Link to the User who created this log
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  salah: {
  fajr: { type: String, enum: ['Jammat', 'Individual', 'Qaza', 'Missed'], default: 'Missed' },
  dhuhr: { type: String, enum: ['Jammat', 'Individual', 'Qaza', 'Missed'], default: 'Missed' },
  asr: { type: String, enum: ['Jammat', 'Individual', 'Qaza', 'Missed'], default: 'Missed' },
  maghrib: { type: String, enum: ['Jammat', 'Individual', 'Qaza', 'Missed'], default: 'Missed' },
  isha: { type: String, enum: ['Jammat', 'Individual', 'Qaza', 'Missed'], default: 'Missed' }
},
  sleepHours: { type: Number, min: 0, max: 24 },
  productivityPercentage: { type: Number, default: 0 }
}, { timestamps: true });

// This ensures a user can only have ONE log per date
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);