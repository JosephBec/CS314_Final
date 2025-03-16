const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Socket.io reference - we'll set this when we import the router
let io;
router.setIo = function(socketIo) {
  io = socketIo;
};

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
    
    // Special case for the 'unread' route
    if (friendId === 'unread') {
      return res.status(400).json({ error: 'Invalid route. Use /api/messages/unread/:userId for unread messages.' });
    }
    
    // Validate both IDs are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Find all messages between these users in either direction
    const messages = await Message.find({
      $or: [
        { sender: new mongoose.Types.ObjectId(userId), receiver: new mongoose.Types.ObjectId(friendId) },
        { sender: new mongoose.Types.ObjectId(friendId), receiver: new mongoose.Types.ObjectId(userId) }
      ]
    })
    .populate('sender', 'username profileImage')
    .populate('receiver', 'username profileImage')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: new mongoose.Types.ObjectId(friendId),
        receiver: new mongoose.Types.ObjectId(userId),
        'readBy.user': { $ne: new mongoose.Types.ObjectId(userId) }
      },
      {
        $push: {
          readBy: {
            user: new mongoose.Types.ObjectId(userId),
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
    
    // Validate sender and receiver are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const message = new Message({
      sender: new mongoose.Types.ObjectId(sender),
      receiver: new mongoose.Types.ObjectId(receiver),
      content,
      imageUrl: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
    });

    await message.save();
    
    // Populate sender and receiver information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage')
      .populate('receiver', 'username profileImage');

    // Emit to connected users if io is available
    if (io) {
      const connectedUsers = io.sockets.adapter.rooms.get('user_' + receiver);
      if (connectedUsers) {
        io.to('user_' + receiver).emit('newMessage', populatedMessage);
      }
    }
    
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
      
      // Validate sender and receiver are valid ObjectIds
      if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
      
      const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

      const message = new Message({
        sender: new mongoose.Types.ObjectId(sender),
        receiver: new mongoose.Types.ObjectId(receiver),
        imageUrl,
        content: 'Sent an image' // Optional text description
      });

      await message.save();
      
      // Populate sender and receiver information
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username profileImage')
        .populate('receiver', 'username profileImage');

      // Emit to connected users if io is available
      if (io) {
        const connectedUsers = io.sockets.adapter.rooms.get('user_' + receiver);
        if (connectedUsers) {
          io.to('user_' + receiver).emit('newMessage', populatedMessage);
        }
      }
      
      res.json(populatedMessage);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
});

// Add route to check message status
router.get('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Validate messageId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ read: message.readBy, readAt: message.readBy[0]?.readAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message to group chat
router.post('/group', upload.single('image'), async (req, res) => {
  try {
    const { sender, groupId, content } = req.body;
    
    // Validate sender and groupId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const message = new Message({
      sender: new mongoose.Types.ObjectId(sender),
      groupChat: new mongoose.Types.ObjectId(groupId),
      content,
      imageUrl: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
    });

    await message.save();
    
    // Populate sender information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage')
      .populate('groupChat');

    // Emit to connected users if io is available
    if (io) {
      // Format the message for socket emission
      const socketMessage = {
        _id: populatedMessage._id,
        sender: populatedMessage.sender._id,
        content: populatedMessage.content,
        groupId: populatedMessage.groupChat._id,
        createdAt: populatedMessage.createdAt
      };
      
      io.to(groupId).emit('newGroupMessage', socketMessage);
    }
    
    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Send message to group (without file upload)
router.post('/sendToGroup', async (req, res) => {
  try {
    const { senderId, groupId, content, imageUrl } = req.body;
    
    // Validate senderId and groupId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Check if user is a member of the group
    const groupChat = await GroupChat.findById(groupId);
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }
    
    if (!groupChat.members.includes(senderId)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    const message = new Message({
      sender: new mongoose.Types.ObjectId(senderId),
      groupChat: new mongoose.Types.ObjectId(groupId),
      content: content || null,
      imageUrl: imageUrl || null,
      readBy: []
    });
    
    await message.save();
    
    // Populate sender information
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profileImage')
      .populate('groupChat');
    
    // Emit to connected users if io is available
    if (io) {
      // Format the message for socket emission
      const socketMessage = {
        _id: populatedMessage._id,
        sender: populatedMessage.sender._id,
        content: populatedMessage.content,
        groupId: populatedMessage.groupChat._id,
        createdAt: populatedMessage.createdAt
      };
      
      io.to(groupId).emit('newGroupMessage', socketMessage);
    }
    
    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get group messages
router.get('/group/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Validate groupId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }
    
    const messages = await Message.find({ groupChat: new mongoose.Types.ObjectId(groupId) })
      .populate('sender', 'username profileImage')
      .populate('groupChat')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete (unsend) message
router.delete('/unsend/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    
    // Validate messageId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID format' });
    }
    
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

// Get unread message counts
router.get('/unread/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Get unread direct messages
    const directMessages = await Message.aggregate([
      {
        $match: {
          receiver: userObjectId,
          readBy: { $not: { $elemMatch: { user: userObjectId } } },
          groupChat: { $exists: false }
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          senderId: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Get unread group messages
    const groupMessages = await Message.aggregate([
      {
        $match: {
          groupChat: { $exists: true, $ne: null },
          sender: { $ne: userObjectId },
          readBy: { $not: { $elemMatch: { user: userObjectId } } }
        }
      },
      {
        $group: {
          _id: '$groupChat',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          groupId: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      directMessages,
      groupMessages
    });
  } catch (error) {
    console.error('Error getting unread counts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark group messages as read
router.post('/markGroupMessagesAsRead', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    
    // Validate userId and groupId are valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Convert string IDs to ObjectIds
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const groupObjectId = new mongoose.Types.ObjectId(groupId);
    
    // Update all messages in the group that are not from this user and haven't been read by this user
    const result = await Message.updateMany(
      {
        groupChat: groupObjectId,
        sender: { $ne: userObjectId },
        readBy: { $not: { $elemMatch: { user: userObjectId } } }
      },
      {
        $addToSet: {
          readBy: {
            user: userObjectId,
            readAt: new Date()
          }
        }
      }
    );
    
    res.json({ 
      success: true, 
      messagesUpdated: result.modifiedCount || result.nModified 
    });
  } catch (error) {
    console.error('Error marking group messages as read:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 