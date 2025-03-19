const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const Message = require('../models/Message');
const GroupChat = require('../models/GroupChat');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || ''
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio || ''
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for user: ${username}`);

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Login failed: User ${username} not found`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log(`Login failed: Invalid password for user ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Create user object without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      profileImage: user.profileImage || '',
      bio: user.bio || ''
    };

    console.log(`Login successful for user: ${username}`);
    
    // Explicitly set status and headers
    res.status(200)
       .header('Content-Type', 'application/json')
       .json(userResponse);

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Temporary test route to create a test user
router.post('/create-test-user', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpassword', salt);
    
    const testUser = new User({
      username: 'testuser',
      password: hashedPassword
    });

    await testUser.save();
    
    res.json({ 
      message: 'Test user created',
      username: 'testuser',
      password: 'testpassword' // The plain password to use for login
    });
  } catch (error) {
    console.error('Error creating test user:', error.message);
    res.status(500).json({ error: 'Failed to create test user' });
  }
});

// Add a test route to verify the server is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

// Temporary route to delete all users
router.delete('/delete-all-users', async (req, res) => {
  try {
    await User.deleteMany({});
    console.log('All users deleted successfully');
    res.json({ message: 'All users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error.message);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// Delete user account
router.delete('/delete/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all group chats where the user is a member
    const groupChats = await GroupChat.find({ members: userId });
    
    // For each group chat
    for (const chat of groupChats) {
      if (chat.creator.toString() === userId) {
        // If user is the creator, delete the group chat
        await GroupChat.findByIdAndDelete(chat._id);
        // Delete all messages in this group chat
        await Message.deleteMany({ groupId: chat._id });
      } else {
        // If user is just a member, remove them from the group
        await GroupChat.findByIdAndUpdate(chat._id, {
          $pull: { members: userId }
        });
      }
    }

    // Delete all direct messages where user is sender or receiver
    await Message.deleteMany({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    // Delete all friend relationships
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // Finally, delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Account and related data deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

module.exports = router;
