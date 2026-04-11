const express = require('express');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ user, complaints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'citizen' })
      .select('name points badges complaintCount')
      .sort({ points: -1 })
      .limit(10);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;