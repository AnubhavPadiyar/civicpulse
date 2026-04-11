const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEPARTMENT_MAP = {
  'Garbage & Waste': 'Sanitation',
  'Drainage & Sewage': 'Sanitation',
  'Water Supply': 'Water',
  'Roads & Infrastructure': 'Roads',
  'Electricity & Streetlights': 'Electricity',
  'Public Nuisance': 'Municipal',
};

const AUTHORITY_MAP = {
  'Sanitation':  'Municipal Sanitation Department',
  'Water':       'Water Supply & Sewerage Board',
  'Roads':       'Public Works Department (PWD)',
  'Electricity': 'Electricity Distribution Department',
  'Municipal':   'Municipal Corporation',
};

// Detect priority from complaint text keywords when Gemini is unavailable
function detectPriority(text) {
  const t = text.toLowerCase();
  if (/(accident|fire|flood|electric shock|collapse|danger|emergency|death|sewage overflow|no water.{0,20}days|blackout)/.test(t))
    return 'Critical';
  if (/(no water|no electricity|major|broken|blocked|overflow|days|week|urgent|severe|injury)/.test(t))
    return 'High';
  if (/(pothole|garbage|dirty|smell|noise|delay|not working|leaking|crack)/.test(t))
    return 'Medium';
  return 'Low';
}

async function processWithGemini(text, category) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a civic complaint AI for Indian cities. Analyze this complaint carefully and return ONLY a raw JSON object (no markdown, no backticks, no extra text).

Complaint text: "${text}"
Suggested category: "${category || 'unknown'}"

Rules:
- category: pick the BEST match from: Garbage & Waste, Water Supply, Roads & Infrastructure, Electricity & Streetlights, Drainage & Sewage, Public Nuisance
- priority: Critical (immediate danger/health risk), High (major disruption), Medium (moderate issue), Low (minor inconvenience)
- authority: the specific department name e.g. "Municipal Sanitation Department" or "Public Works Department (PWD)" or "Water Supply & Sewerage Board" or "Electricity Distribution Department"
- department: one of exactly: Sanitation, Water, Roads, Electricity, Municipal
- sdgTags: array of relevant SDG numbers e.g. ["SDG 11", "SDG 6"]
- sdgMessage: one sentence about environmental/social impact
- formalComplaint: formal 2-3 sentence complaint in official language

IMPORTANT: The department and authority must match the category. Do NOT assign Municipal/Municipal Corporation unless category is Public Nuisance.

Return ONLY this JSON:
{"category":"...","priority":"...","authority":"...","department":"...","sdgTags":["..."],"sdgMessage":"...","formalComplaint":"..."}`;

  const result = await model.generateContent(prompt);
  let text2 = result.response.text().trim();
  text2 = text2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = text2.indexOf('{');
  const end = text2.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    text2 = text2.substring(start, end + 1);
  }
  const parsed = JSON.parse(text2);

  // Safety net: correct wrong department/authority from Gemini
  const expectedDept = DEPARTMENT_MAP[parsed.category];
  if (expectedDept && parsed.department !== expectedDept) {
    parsed.department = expectedDept;
    parsed.authority = AUTHORITY_MAP[expectedDept];
  }

  return parsed;
}

// POST /api/complaints
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { rawText, category, locationAddress, locationLat, locationLng } = req.body;
    if (!rawText) return res.status(400).json({ message: 'Complaint text is required' });

    let aiData = {};
    try {
      aiData = await processWithGemini(rawText, category);
      console.log('Gemini result:', aiData);
    } catch (aiErr) {
      console.error('Gemini error:', aiErr.message);

      const dept = DEPARTMENT_MAP[category] || 'Municipal';
      const authority = AUTHORITY_MAP[dept];
      const priority = detectPriority(rawText);

      aiData = {
        category: category || 'Public Nuisance',
        priority,
        authority,
        department: dept,
        sdgTags: ['SDG 11'],
        sdgMessage: 'This issue affects sustainable urban living and community well-being.',
        formalComplaint: `This is to respectfully bring to your attention that ${rawText}. Immediate action is requested to resolve this civic issue and restore normalcy for the affected residents.`
      };
    }

    const complaint = await Complaint.create({
      user: req.user._id,
      rawText,
      category: aiData.category,
      priority: aiData.priority,
      authority: aiData.authority,
      department: aiData.department || DEPARTMENT_MAP[aiData.category] || 'Municipal',
      sdgTags: aiData.sdgTags || [],
      sdgMessage: aiData.sdgMessage || '',
      formalComplaint: aiData.formalComplaint,
      location: {
        address: locationAddress || '',
        lat: locationLat ? parseFloat(locationLat) : null,
        lng: locationLng ? parseFloat(locationLng) : null
      },
      imageUrl: req.file ? `/uploads/${req.file.filename}` : '',
      aiProcessed: true
    });

    // Update user stats and badges
    const user = await User.findById(req.user._id);
    user.complaintCount += 1;
    if (aiData.sdgTags?.length && !user.badges.includes('eco_warrior')) {
      user.badges.push('eco_warrior'); user.points += 200;
    }
    if (['Critical', 'High'].includes(aiData.priority) && !user.badges.includes('rapid_reporter')) {
      user.badges.push('rapid_reporter'); user.points += 150;
    }
    user.checkAndAwardBadges();
    await user.save();

    res.status(201).json({ complaint });
  } catch (err) {
    console.error('COMPLAINT ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/complaints/track/:trackingId
router.get('/track/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found. Check your tracking ID.' });
    res.json({ complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/complaints/my
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
