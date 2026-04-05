const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// All admin routes are protected
router.use(protect, adminOnly);

// Helper — filter by department
const deptFilter = (user) => {
  if (!user.department || user.department === 'all') return {};
  return { department: user.department };
};

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const filter = deptFilter(req.user);

    const [total, submitted, underReview, inProgress, resolved, rejected] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'Submitted' }),
      Complaint.countDocuments({ ...filter, status: 'Under Review' }),
      Complaint.countDocuments({ ...filter, status: 'In Progress' }),
      Complaint.countDocuments({ ...filter, status: 'Resolved' }),
      Complaint.countDocuments({ ...filter, status: 'Rejected' }),
    ]);

    // Priority breakdown
    const priorityAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const priorityBreakdown = {};
    priorityAgg.forEach(p => { priorityBreakdown[p._id] = p.count; });

    // Recent complaints
    const recentComplaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name email');

    res.json({
      stats: { total, submitted, underReview, inProgress, resolved, rejected },
      priorityBreakdown,
      recentComplaints
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/complaints
router.get('/complaints', async (req, res) => {
  try {
    const filter = deptFilter(req.user);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/complaints/:id
router.put('/complaints/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status || complaint.status;
    complaint.adminNotes = adminNotes || complaint.adminNotes;
    await complaint.save();

    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const filter = deptFilter(req.user);

    const [total, resolved, critical] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.countDocuments({ ...filter, status: 'Resolved' }),
      Complaint.countDocuments({ ...filter, priority: 'Critical' }),
    ]);

    // Category breakdown
    const categoryAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const categoryBreakdown = {};
    categoryAgg.forEach(c => { if (c._id) categoryBreakdown[c._id] = c.count; });

    // Priority breakdown
    const priorityAgg = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const priorityBreakdown = {};
    priorityAgg.forEach(p => { if (p._id) priorityBreakdown[p._id] = p.count; });

    // SDG breakdown
    const sdgAgg = await Complaint.aggregate([
      { $match: filter },
      { $unwind: '$sdgTags' },
      { $group: { _id: '$sdgTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const sdgBreakdown = {};
    sdgAgg.forEach(s => { sdgBreakdown[s._id] = s.count; });

    // Avg resolution days
    const resolvedComplaints = await Complaint.find({ ...filter, status: 'Resolved', resolvedAt: { $exists: true } });
    let avgDays = 0;
    if (resolvedComplaints.length) {
      const totalDays = resolvedComplaints.reduce((sum, c) => {
        return sum + Math.ceil((c.resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = Math.round(totalDays / resolvedComplaints.length);
    }

    // Trend - last 14 days
    const trendData = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i); start.setHours(0,0,0,0);
      const end = new Date(); end.setDate(end.getDate() - i); end.setHours(23,59,59,999);
      const count = await Complaint.countDocuments({ ...filter, createdAt: { $gte: start, $lte: end } });
      trendData.push(count);
    }

    res.json({
      stats: { total, resolved, critical, avgDays },
      categoryBreakdown,
      priorityBreakdown,
      sdgBreakdown,
      trendData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;