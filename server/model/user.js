const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  department: {
    type: String,
    required: true,
    enum: ['sales', 'hr', 'engineering', 'finance', 'legal', 'admin'], 
  },

  role: {
    type: String,
    default: 'user',
    enum: ['admin', 'user']
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
