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
    fajr: { type: Number, default: 0 },    // 1:Qaza, 2:Indiv, 3:Jamat
    dhuhr: { type: Number, default: 0 },
    asr: { type: Number, default: 0 },
    maghrib: { type: Number, default: 0 },
    isha: { type: Number, default: 0 }
  },
  sleepHours: { type: Number, min: 0, max: 24 },
  productivityPercentage: { type: Number, default: 0 }
}, { timestamps: true });

// This ensures a user can only have ONE log per date
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);