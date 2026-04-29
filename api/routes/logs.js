const express = require('express');
const router = express.Router();
const DailyLog = require('../../models/DailyLog'); // Goes up to root from api/routes

router.get('/anchor-date', async (req, res) => {
  try {
    const firstLog = await DailyLog.findOne({ userId: req.user.id }).sort({ date: 1 });
    const anchor = firstLog ? firstLog.date : new Date().toISOString().split('T')[0];
    res.json({ anchorDate: anchor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching anchor" });
  }
});

module.exports = router;