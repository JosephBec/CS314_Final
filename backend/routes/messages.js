const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function(req, file, cb) {
    cb(null, 'message-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// Get messages between two users
router.get('/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    console.log('Fetching messages for users:', userId, friendId); // Debug log

    // Find all messages between these users in either direction
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    })
    .populate('sender', 'username profileImage')
    .populate('receiver', 'username profileImage')
    .sort({ createdAt: 1 });

    console.log('Found messages:', messages); // Debug log

    // Mark messages as read
    await Message.updateMany(
      {
        sender: friendId,
        receiver: userId,
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(400).json({ error: error.message });
  }
});

// Send direct message
router.post('/send', upload.single('image'), async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    console.log('Sending message:', { sender, receiver, content }); // Debug log

    const message = new Message({
      sender,
      receiver,
      content,
      imageUrl: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
    });

    await message.save();
    
    // Populate sender and receiver information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage');

    console.log('Saved message:', populatedMessage); // Debug log
    
    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add new route for image messages
router.post('/send-image', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || err });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
      const { sender, receiver } = req.body;
      const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

      const message = new Message({
        sender,
        receiver,
        imageUrl,
        content: 'Sent an image' // Optional text description
      });

      await message.save();
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

// Add route to check message status
router.get('/status/:messageId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    res.json({ read: message.readBy, readAt: message.readBy[0].readAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message to group chat
router.post('/group', upload.single('image'), async (req, res) => {
  try {
    const { sender, groupId, content } = req.body;
    console.log('Sending group message:', { sender, groupId, content }); // Debug log

    const message = new Message({
      sender,
      groupChat: groupId,
      content,
      imageUrl: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
    });

    await message.save();
    
    // Populate sender information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage');

    console.log('Saved group message:', populatedMessage); // Debug log
    
    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete (unsend) message
router.delete('/unsend/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if message is less than 1 minute old
    const messageAge = Date.now() - message.createdAt.getTime();
    const oneMinute = 60 * 1000; // 1 minute in milliseconds

    if (messageAge > oneMinute) {
      return res.status(403).json({ 
        error: 'Messages can only be unsent within 1 minute of sending' 
      });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ message: 'Message unsent successfully' });

  } catch (error) {
    console.error('Error unsending message:', error);
    res.status(500).json({ error: 'Error unsending message' });
  }
});

module.exports = router; 