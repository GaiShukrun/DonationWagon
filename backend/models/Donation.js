const mongoose = require('mongoose');

// Schema for clothing items
const clothingItemSchema = new mongoose.Schema({
  type: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  gender: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  images: [{ type: String }]
});

// Schema for toy items
const toyItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  ageGroup: { type: String, required: true },
  condition: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  images: [{ type: String }]
});

// Main donation schema
const donationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  donationType: { 
    type: String, 
    required: true,
    enum: ['clothes', 'toys']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  clothingItems: [clothingItemSchema],
  toyItems: [toyItemSchema],
  pickupDate: { type: Date },
  pickupAddress: { type: String },
  pickupNotes: { type: String },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field on save
donationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
