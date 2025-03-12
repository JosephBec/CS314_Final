const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupChat'
  },
  content: {
    type: String,
    required: function() {
      return !this.imageUrl;
    }
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date }
  }]
}, {
  timestamps: true
});

// Add custom validation to ensure either receiver or groupChat is set
messageSchema.pre('save', function(next) {
  if (!this.receiver && !this.groupChat) {
    next(new Error('Message must have either a receiver or a group chat'));
  } else if (this.receiver && this.groupChat) {
    next(new Error('Message cannot have both a receiver and a group chat'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', messageSchema); 