const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  department: { type: String, default: null }, // only for admins
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  complaintCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.checkAndAwardBadges = function () {
  const newBadges = [];

  if (this.complaintCount >= 1 && !this.badges.includes('civic_starter')) {
    this.badges.push('civic_starter');
    this.points += 50;
    newBadges.push('civic_starter');
  }
  if (this.complaintCount >= 10 && !this.badges.includes('city_guardian')) {
    this.badges.push('city_guardian');
    this.points += 500;
    newBadges.push('city_guardian');
  }

  return newBadges;
};

module.exports = mongoose.model('User', userSchema);