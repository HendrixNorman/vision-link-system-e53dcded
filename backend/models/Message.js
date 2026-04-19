const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Message title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  target: {
    type: String,
    enum: ['all', 'parents', 'students', 'teachers', 'specific'],
    required: [true, 'Target audience is required']
  },
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'academic', 'administrative', 'emergency', 'event'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ target: 1, isActive: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

// Method to check if message is expired
messageSchema.methods.isExpired = function() {
  return this.expiryDate && this.expiryDate < new Date();
};

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
};

module.exports = mongoose.model('Message', messageSchema);
