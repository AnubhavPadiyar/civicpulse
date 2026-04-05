const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const complaintSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    unique: true,
    default: () => 'CP-' + uuidv4().slice(0, 8).toUpperCase()
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rawText: { type: String, required: true },
  formalComplaint: { type: String },
  category: { type: String },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  authority: { type: String },
  department: { type: String },
  sdgTags: [{ type: String }],
  sdgMessage: { type: String },
  location: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  imageUrl: { type: String },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Submitted'
  },
  adminNotes: { type: String },
  aiProcessed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

complaintSchema.pre('save', async function () {
  this.updatedAt = new Date();
  if (this.status === 'Resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);