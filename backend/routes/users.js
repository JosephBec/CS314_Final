const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'))
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Add file filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload profile image
router.post('/:userId/profile-image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.params.userId;
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    console.log('Updating user profile image:', { userId, imageUrl });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User updated successfully:', updatedUser);

    res.json({
      profileImage: imageUrl,
      message: 'Profile image updated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete user account
router.delete('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's friends
    const user = await User.findById(userId);
    
    // Remove user from all friends' lists
    await User.updateMany(
      { _id: { $in: user.friends } },
      { $pull: { friends: userId } }
    );

    // Remove user from all friend requests
    await User.updateMany(
      { friendRequests: userId },
      { $pull: { friendRequests: userId } }
    );

    // Delete all messages involving the user
    await Message.deleteMany({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password'); // Exclude password from the response
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

// Update user bio
router.put('/:userId/bio', async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.params.userId;
    
    if (!bio && bio !== '') {
      return res.status(400).json({ error: 'Bio content is required' });
    }
    
    if (bio.length > 500) {
      return res.status(400).json({ error: 'Bio cannot exceed 500 characters' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: updatedUser,
      message: 'Bio updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating bio:', error.message);
    res.status(500).json({ error: 'Failed to update bio' });
  }
});

// Update user profile information
router.put('/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { firstName, lastName } = req.body;

    console.log('Updating user profile:', { userId, firstName, lastName });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User updated successfully:', JSON.stringify(updatedUser));

    res.json({
      user: updatedUser,
      message: 'Profile information updated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to update profile information' });
  }
});

// Clear friend request notifications
router.post('/clear-notifications', async (req, res) => {
  try {
    const { userId } = req.body;
    
    await User.findByIdAndUpdate(userId, {
      hasNewFriendRequests: false
    });
    
    res.json({ message: 'Notifications cleared successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 