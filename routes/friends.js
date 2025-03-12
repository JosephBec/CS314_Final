const router = require('express').Router();
const User = require('../models/User');

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { userId, friendUsername } = req.body;
    
    // Find the friend by username
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if friend request already exists
    if (friend.friendRequests.includes(userId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if they're already friends
    if (friend.friends.includes(userId)) {
      return res.status(400).json({ error: 'You are already friends' });
    }

    // Add friend request
    await User.findByIdAndUpdate(friend._id, {
      $addToSet: { friendRequests: userId }
    });

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Accept friend request
router.post('/accept', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await User.findByIdAndUpdate(userId, {
      $pull: { friendRequests: friendId },
      $addToSet: { friends: friendId }
    });
    await User.findByIdAndUpdate(friendId, {
      $addToSet: { friends: userId }
    });
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get friend requests
router.get('/requests/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const requests = await User.find({ _id: { $in: user.friendRequests } });
    res.json(requests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject friend request
router.post('/reject', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    await User.findByIdAndUpdate(userId, {
      $pull: { friendRequests: friendId }
    });
    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get friends list
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await User.find({ _id: { $in: user.friends } });
    res.json(friends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove friend
router.post('/remove', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    // Remove friend from user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    // Remove user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add remove friend route
router.delete('/remove/:userId/:friendId', async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    // Remove from both users' friend lists
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 