const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');
const GroupChat = require('../../models/GroupChat');
const Message = require('../../models/Message');
const app = require('../mockServer');

// Import the test setup
require('../setup');

describe('Group Message Management', () => {
  let users = [];

  // Create test users before each test
  beforeEach(async () => {
    // Create multiple users for group testing
    const userPromises = [];
    for (let i = 1; i <= 3; i++) {
      userPromises.push(
        User.create({
          username: `groupuser${i}`,
          password: 'password123',
          email: `groupuser${i}@example.com`
        })
      );
    }
    
    users = await Promise.all(userPromises);
  });

  // Test case 3.5.1: Create a New Group
  describe('3.5.1 Create a New Group', () => {
    it('should create a new group with multiple members', async () => {
      const groupData = {
        name: 'Test Group',
        creator: users[0]._id.toString(),
        members: users.map(user => user._id.toString())
      };

      const response = await request(app)
        .post('/api/groups/create')
        .send(groupData)
        .expect(201);

      // Verify response
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', groupData.name);
      expect(response.body).toHaveProperty('creator');
      expect(response.body).toHaveProperty('members');
      expect(response.body.members.length).toBe(users.length);
      
      // Verify group was created in the database
      const group = await GroupChat.findById(response.body._id);
      expect(group).toBeTruthy();
      expect(group.name).toBe(groupData.name);
      expect(group.creator.toString()).toBe(users[0]._id.toString());
      expect(group.members.length).toBe(users.length);
      
      // Verify all members are in the group
      const memberIds = group.members.map(id => id.toString());
      for (const user of users) {
        expect(memberIds).toContain(user._id.toString());
      }
    });

    it('should reject group creation with invalid data', async () => {
      const invalidGroupData = {
        // Missing required name
        creator: users[0]._id.toString(),
        members: users.map(user => user._id.toString())
      };

      const response = await request(app)
        .post('/api/groups/create')
        .send(invalidGroupData)
        .expect(400);

      // Verify response contains error information
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test case 3.5.2: Send Message to Group
  describe('3.5.2 Send Message to Group', () => {
    let group;

    beforeEach(async () => {
      // Create a test group
      group = await GroupChat.create({
        name: 'Message Test Group',
        creator: users[0]._id,
        members: users.map(user => user._id)
      });
    });

    it('should send a message to a group and make it available to all members', async () => {
      const messageData = {
        senderId: users[0]._id.toString(),
        groupId: group._id.toString(),
        content: 'Test group message'
      };

      const response = await request(app)
        .post('/api/messages/sendToGroup')
        .send(messageData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('content', messageData.content);
      expect(response.body).toHaveProperty('sender');
      expect(response.body).toHaveProperty('groupChat');
      
      // Verify message was stored in the database
      const message = await Message.findById(response.body._id);
      expect(message).toBeTruthy();
      expect(message.content).toBe(messageData.content);
      expect(message.sender.toString()).toBe(users[0]._id.toString());
      expect(message.groupChat.toString()).toBe(group._id.toString());
    });

    it('should reject messages from non-members', async () => {
      // Create a non-member user
      const nonMember = await User.create({
        username: 'nonmember',
        password: 'password123',
        email: 'nonmember@example.com'
      });

      const messageData = {
        senderId: nonMember._id.toString(),
        groupId: group._id.toString(),
        content: 'Test message from non-member'
      };

      const response = await request(app)
        .post('/api/messages/sendToGroup')
        .send(messageData)
        .expect(403);

      // Verify response contains error information
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not a member/i);
    });
  });

  // Additional group management tests
  describe('Additional Group Management Tests', () => {
    let group;

    beforeEach(async () => {
      // Create a test group
      group = await GroupChat.create({
        name: 'Management Test Group',
        creator: users[0]._id,
        members: [users[0]._id, users[1]._id] // Initially only include 2 members
      });
    });

    it('should add a member to an existing group', async () => {
      const addMemberData = {
        groupId: group._id.toString(),
        userId: users[2]._id.toString()
      };

      const response = await request(app)
        .post('/api/groups/addMember')
        .send(addMemberData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('members');
      expect(response.body.members.length).toBe(3);
      
      // Verify database was updated
      const updatedGroup = await GroupChat.findById(group._id);
      expect(updatedGroup.members.length).toBe(3);
      
      // Verify the new member is in the group
      const memberIds = updatedGroup.members.map(id => id.toString());
      expect(memberIds).toContain(users[2]._id.toString());
    });

    it('should remove a member from a group', async () => {
      const removeMemberData = {
        groupId: group._id.toString(),
        userId: users[1]._id.toString()
      };

      const response = await request(app)
        .post('/api/groups/removeMember')
        .send(removeMemberData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('members');
      expect(response.body.members.length).toBe(1);
      
      // Verify database was updated
      const updatedGroup = await GroupChat.findById(group._id);
      expect(updatedGroup.members.length).toBe(1);
      
      // Verify the member was removed
      const memberIds = updatedGroup.members.map(id => id.toString());
      expect(memberIds).not.toContain(users[1]._id.toString());
    });
  });
});
