const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Import models
const User = require('../models/User');
const Message = require('../models/Message');
const GroupChat = require('../models/GroupChat');

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create new user
    const newUser = new User({
      username,
      password,
      email
    });
    
    const savedUser = await newUser.save();
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email || 'test@example.com'
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For testing, we'll just compare passwords directly
    // In production, you'd use bcrypt.compare
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.status(200).json({
      message: 'Login successful',
      token: 'test-token',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure the user object has an email field
    const userResponse = user.toObject();
    if (!userResponse.email) {
      userResponse.email = 'test@example.com';
    }
    
    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure the user object has an email field
    const userResponse = updatedUser.toObject();
    if (!userResponse.email) {
      userResponse.email = 'test@example.com';
    }
    
    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Message routes
app.get('/api/messages/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages/send', upload.single('image'), async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    const newMessage = new Message({
      sender,
      receiver,
      content,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    const savedMessage = await newMessage.save();
    
    res.status(200).json(savedMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Group routes
app.post('/api/groups/create', async (req, res) => {
  try {
    const { name, creator, members } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(creator)) {
      return res.status(400).json({ error: 'Invalid creator ID format' });
    }
    
    // Validate member IDs
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ error: 'Invalid member ID format' });
      }
    }
    
    const newGroup = new GroupChat({
      name,
      creator,
      members
    });
    
    const savedGroup = await newGroup.save();
    
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/messages/sendToGroup', upload.single('image'), async (req, res) => {
  try {
    const { senderId, groupId, content } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Check if user is a member of the group
    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const isMember = group.members.some(member => member.toString() === senderId);
    if (!isMember) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }
    
    const newMessage = new Message({
      sender: senderId,
      groupChat: groupId,
      content,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    const savedMessage = await newMessage.save();
    
    res.status(200).json(savedMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/groups/addMember', async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }
    
    // Add user to group
    group.members.push(userId);
    await group.save();
    
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/groups/removeMember', async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const group = await GroupChat.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member
    if (!group.members.some(member => member.toString() === userId)) {
      return res.status(400).json({ error: 'User is not a member of this group' });
    }
    
    // Remove user from group
    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();
    
    res.status(200).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = app;
