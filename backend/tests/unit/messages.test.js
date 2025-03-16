const request = require('supertest');
const mongoose = require('mongoose');
const Message = require('../../models/Message');
const User = require('../../models/User');
const app = require('../mockServer');

// Import the test setup
require('../setup');

describe('Message Handling', () => {
  let sender, receiver;

  // Create test users before each test
  beforeEach(async () => {
    // Create two users for message testing
    sender = await User.create({
      username: 'sender',
      password: 'password123',
      email: 'sender@example.com'
    });

    receiver = await User.create({
      username: 'receiver',
      password: 'password123',
      email: 'receiver@example.com'
    });
  });

  // Test case 3.2.1: Send Message to Valid User
  describe('3.2.1 Send Message to Valid User', () => {
    it('should send a message to a valid user and store it correctly', async () => {
      const messageData = {
        sender: sender._id.toString(),
        receiver: receiver._id.toString(),
        content: 'Test message content'
      };

      const response = await request(app)
        .post('/api/messages/send')
        .send(messageData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('content', messageData.content);
      expect(response.body).toHaveProperty('sender');
      expect(response.body).toHaveProperty('receiver');

      // Verify message was stored in the database
      const message = await Message.findById(response.body._id);
      expect(message).toBeTruthy();
      expect(message.content).toBe(messageData.content);
      expect(message.sender.toString()).toBe(sender._id.toString());
      expect(message.receiver.toString()).toBe(receiver._id.toString());
    });

    it('should reject a message with invalid user IDs', async () => {
      const messageData = {
        sender: sender._id.toString(),
        receiver: 'invalid-id',
        content: 'Test message content'
      };

      const response = await request(app)
        .post('/api/messages/send')
        .send(messageData)
        .expect(400);

      // Verify response
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test case 3.2.2: Retrieve Message History
  describe('3.2.2 Retrieve Message History', () => {
    beforeEach(async () => {
      // Create some test messages
      await Message.create({
        sender: sender._id,
        receiver: receiver._id,
        content: 'Message 1 from sender to receiver'
      });

      await Message.create({
        sender: receiver._id,
        receiver: sender._id,
        content: 'Message 2 from receiver to sender'
      });

      await Message.create({
        sender: sender._id,
        receiver: receiver._id,
        content: 'Message 3 from sender to receiver'
      });
    });

    it('should retrieve message history between two users', async () => {
      const response = await request(app)
        .get(`/api/messages/${sender._id}/${receiver._id}`)
        .expect(200);

      // Verify response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Verify messages are in correct order (by creation time)
      expect(response.body[0].content).toBe('Message 1 from sender to receiver');
      expect(response.body[1].content).toBe('Message 2 from receiver to sender');
      expect(response.body[2].content).toBe('Message 3 from sender to receiver');
    });

    it('should handle invalid user IDs when retrieving messages', async () => {
      const response = await request(app)
        .get(`/api/messages/${sender._id}/invalid-id`)
        .expect(400);

      // Verify response
      expect(response.body).toHaveProperty('error');
    });
  });
});
