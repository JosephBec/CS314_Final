const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
const connectedUsers = {};
const typingUsers = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User connects and registers their ID
  socket.on('register', (userId) => {
    console.log('User registered:', userId);
    connectedUsers[userId] = socket.id;
    socket.userId = userId;
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
    console.log(`User ${socket.userId} joined group ${groupId}`);
  });
  
  // User leaves a group chat room
  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.userId} left group ${groupId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.userId) {
      delete connectedUsers[socket.userId];
    }
  });
});

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

// Set port to 5000
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
