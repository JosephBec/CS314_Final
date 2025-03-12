const express = require('express');
const router = express.Router();
const GroupChat = require('../models/GroupChat');
const Message = require('../models/Message');
const User = require('../models/User');

// Create a new group chat
router.post('/create', async (req, res) => {
  try {
    const { name, creator, members } = req.body;
    const groupChat = new GroupChat({
      name,
      creator,
      members: [...new Set([...members, creator])] // Ensure unique members including creator
    });
    await groupChat.save();
    
    // Populate members before sending response
    const populatedGroupChat = await GroupChat.findById(groupChat._id)
      .populate('members', 'username profileImage');
    
    res.json(populatedGroupChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's group chats
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const groupChats = await GroupChat.find({
      members: userId
    }).populate('members', 'username profileImage');
    
    res.json(groupChats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add member to group chat
router.post('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const updatedGroup = await GroupChat.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'username profileImage');

    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove member from group chat
router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const groupChat = await GroupChat.findByIdAndUpdate(
      req.params.groupId,
      { $pull: { members: req.params.userId } },
      { new: true }
    ).populate('members', 'username profileImage');
    res.json(groupChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get group chat messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      groupChat: req.params.groupId
    })
    .populate('sender', 'username profileImage')
    .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add new route to get a single group chat
router.get('/:groupId', async (req, res) => {
  try {
    const groupChat = await GroupChat.findById(req.params.groupId)
      .populate('members', 'username profileImage');
    
    if (!groupChat) {
      return res.status(404).json({ error: 'Group chat not found' });
    }
    
    res.json(groupChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 