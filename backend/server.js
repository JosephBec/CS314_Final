const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Socket.IO connection handling
const connectedUsers = {};
const typingUsers = {};

// Helper function to log only in development mode
const devLog = (message) => {
  if (process.env.NODE_ENV !== 'production') {
    // Uncomment the line below if you want to see socket logs during development
    // console.log(message);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const friendRoutes = require('./routes/friends');
const userRoutes = require('./routes/users');
const groupChatRoutes = require('./routes/groupChats');
const Message = require('./models/Message');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groupchats', groupChatRoutes);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Export for testing
module.exports = app;

// Only start the server if this file is run directly, not when imported for testing
if (require.main === module) {
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  messageRoutes.setIo(io);

  io.on('connection', (socket) => {
    devLog('New client connected: ' + socket.id);
    
    // User connects and registers their ID
    socket.on('register', (userId) => {
      devLog('User registered: ' + userId);
      connectedUsers[userId] = socket.id;
      socket.userId = userId;
      
      // Join user's personal room for direct messages
      socket.join('user_' + userId);
      devLog(`User ${userId} joined their personal room`);
    });
    
    // User joins a room (for direct messages or group chats)
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      devLog(`User ${socket.userId} joined room ${roomId}`);
    });
    
    // User starts typing
    socket.on('typing', (data) => {
      const { userId, receiverId, groupId } = data;
      
      if (groupId) {
        // Group chat typing
        socket.to(groupId).emit('userTyping', {
          userId,
          username: data.username,
          groupId
        });
      } else if (receiverId) {
        // Direct message typing
        const receiverSocketId = connectedUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            userId,
            username: data.username,
            receiverId
          });
        }
      }
    });
    
    // User stops typing
    socket.on('stopTyping', (data) => {
      const { userId, receiverId, groupId } = data;
      
      if (groupId) {
        // Group chat stop typing
        socket.to(groupId).emit('userStoppedTyping', {
          userId,
          groupId
        });
      } else if (receiverId) {
        // Direct message stop typing
        const receiverSocketId = connectedUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userStoppedTyping', {
            userId,
            receiverId
          });
        }
      }
    });
    
    // User joins a group chat room
    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
      devLog(`User ${socket.userId} joined group ${groupId}`);
    });
    
    // User leaves a group chat room
    socket.on('leaveGroup', (groupId) => {
      socket.leave(groupId);
      devLog(`User ${socket.userId} left group ${groupId}`);
    });
    
    // Listen for new messages
    socket.on('sendMessage', async (messageData) => {
      try {
        const { senderId, receiverId, content, imageUrl } = messageData;
        
        // Emit to the receiver if they're connected
        const receiverSocketId = connectedUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', {
            sender: senderId,
            content,
            imageUrl,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error sending message via socket:', error);
      }
    });
    
    // Listen for new group messages
    socket.on('sendGroupMessage', async (messageData) => {
      try {
        const { senderId, groupId, content, imageUrl } = messageData;
        
        // Emit to all members in the group chat
        socket.to(groupId).emit('newGroupMessage', {
          sender: senderId,
          content,
          groupId,
          imageUrl,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error sending group message via socket:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      devLog('Client disconnected: ' + socket.id);
      if (socket.userId) {
        delete connectedUsers[socket.userId];
      }
    });
  });

  // Set port to 5000
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Export server and io for socket testing
  module.exports.server = server;
  module.exports.io = io;
}
