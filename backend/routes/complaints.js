const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEPARTMENT_MAP = {
  'Garbage & Waste': 'Sanitation',
  'Drainage & Sewage': 'Sanitation',
  'Water Supply': 'Water',
  'Roads & Infrastructure': 'Roads',
  'Electricity & Streetlights': 'Electricity',
  'Public Nuisance': 'Municipal',
};

async function processWithGemini(text, category) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `You are a civic complaint processing AI for an Indian city. Analyze this complaint and respond ONLY with a valid JSON object, no markdown, no extra text.
Complaint: "${text}"
Category hint: "${category || 'unknown'}"
Respond with exactly this JSON structure:
{"category":"one of: Garbage & Waste, Water Supply, Roads & Infrastructure, Electricity & Streetlights, Drainage & Sewage, Public Nuisance","priority":"one of: Low, Medium, High, Critical","authority":"specific department name","department":"one of: Sanitation, Water, Roads, Electricity, Municipal","sdgTags":["SDG 11"],"sdgMessage":"one sentence","formalComplaint":"formal complaint"}`;
  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();
  const cleaned = responseText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

router.post('/', protect, async (req, res) => {
  console.log('COMPLAINT HIT');
  try {
    const { rawText, category, locationAddress, locationLat, locationLng } = req.body;
    if (!rawText) return res.status(400).json({ message: 'Complaint text is required' });

    let aiData = {};
    try {
      aiData = await processWithGemini(rawText, category);
    } catch (aiErr) {
      console.error('Gemini error:', aiErr.message);
      aiData = {
        category: category || 'Public Nuisance',
        priority: 'Medium',
        authority: 'Municipal Corporation',
        department: 'Municipal',
        sdgTags: ['SDG 11'],
        sdgMessage: 'This issue affects sustainable urban living.',
        formalComplaint: `This is to bring to your attention that ${rawText}`
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
      imageUrl: '',
      aiProcessed: true
    });

    const user = await User.findById(req.user._id);
    user.complaintCount += 1;
    if (aiData.sdgTags?.length && !user.badges.includes('eco_warrior')) { user.badges.push('eco_warrior'); user.points += 200; }
    if (['Critical', 'High'].includes(aiData.priority) && !user.badges.includes('rapid_reporter')) { user.badges.push('rapid_reporter'); user.points += 150; }
    user.checkAndAwardBadges();
    await user.save();

    console.log('Created:', complaint.trackingId);
    res.status(201).json({ complaint });
  } catch (err) {
    console.error('ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/track/:trackingId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ trackingId: req.params.trackingId });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ complaint });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;