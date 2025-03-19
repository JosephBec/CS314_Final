import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
jest.mock('axios');
jest.mock('../context/AuthContext');
jest.mock('../context/SocketContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock HTMLAudioElement
window.HTMLAudioElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
window.HTMLAudioElement.prototype.pause = jest.fn();

describe('Dashboard Component Event Tests', () => {
  const mockUser = { 
    id: 'test-user-id', 
    username: 'testuser',
    profileImage: 'test.jpg',
    bio: 'Test bio'
  };
  
  let mockSocketCallbacks = {};
  
  const mockSocket = {
    on: jest.fn((event, callback) => {
      mockSocketCallbacks[event] = callback;
    }),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockSocketCallbacks = {};
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify(mockUser)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
    
    // Mock auth context
    useAuth.mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
      updateUser: jest.fn(),
      setUser: jest.fn()
    });
    
    // Mock socket context
    useSocket.mockReturnValue({
      socket: mockSocket,
      isConnected: true
    });
    
    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/friends/')) {
        return Promise.resolve({
          data: [
            { _id: 'friend1', username: 'friend1', profileImage: 'friend1.jpg' },
            { _id: 'friend2', username: 'friend2', profileImage: 'friend2.jpg' }
          ]
        });
      } else if (url.includes('/api/messages')) {
        if (url.includes('/api/messages/unread/')) {
          return Promise.resolve({
            data: {
              directMessages: [
                { senderId: 'friend1', count: 2 }
              ],
              groupMessages: [
                { groupId: 'group1', count: 3 }
              ]
            }
          });
        }
        return Promise.resolve({ data: [] });
      } else if (url.includes('/api/friends/requests/')) {
        return Promise.resolve({ data: [] });
      } else if (url.includes('/api/groupchats/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    
    // Mock axios post
    axios.post.mockResolvedValue({ data: {} });
  });

  // Test for socket message event
  test('handles socket message event correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that socket.on was called for the message event
    expect(mockSocket.on).toHaveBeenCalledWith('newMessage', expect.any(Function));
    
    // Simulate receiving a message
    if (mockSocketCallbacks['newMessage']) {
      const mockMessage = {
        _id: 'new-message',
        sender: 'friend1',
        recipient: mockUser.id,
        content: 'Hello from socket',
        createdAt: new Date().toISOString()
      };
      
      act(() => {
        mockSocketCallbacks['newMessage'](mockMessage);
      });
      
      // Select the friend to see if the message appears
      await waitFor(() => {
        const friendElements = screen.getAllByText((content, element) => {
          return content.includes('friend1') || content.includes('friend2');
        });
        
        if (friendElements.length > 0) {
          fireEvent.click(friendElements[0]);
        }
      });
    }
  });
  
  // Test for socket friend request event
  test.skip('handles socket friendRequest event correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that socket.on was called for the friendRequest event
    expect(mockSocket.on).toHaveBeenCalledWith('friendRequest', expect.any(Function));
    
    // Simulate receiving a friend request
    if (mockSocketCallbacks['friendRequest']) {
      const mockRequest = {
        _id: 'new-request',
        username: 'newrequester',
        profileImage: 'newrequester.jpg'
      };
      
      act(() => {
        mockSocketCallbacks['friendRequest'](mockRequest);
      });
    }
  });
  
  // Test for socket friend accept event
  test.skip('handles socket friendAccept event correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that socket.on was called for the friendAccept event
    expect(mockSocket.on).toHaveBeenCalledWith('friendAccept', expect.any(Function));
    
    // Simulate receiving a friend accept
    if (mockSocketCallbacks['friendAccept']) {
      const mockFriend = {
        _id: 'new-friend',
        username: 'newfriend',
        profileImage: 'newfriend.jpg'
      };
      
      act(() => {
        mockSocketCallbacks['friendAccept'](mockFriend);
      });
    }
  });
  
  // Test for socket typing event
  test('handles socket typing event correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that socket.on was called for the userTyping event
    expect(mockSocket.on).toHaveBeenCalledWith('userTyping', expect.any(Function));
    
    // Select a friend to chat with
    await waitFor(() => {
      const friendElements = screen.getAllByText((content, element) => {
        return content.includes('friend1') || content.includes('friend2');
      });
      
      if (friendElements.length > 0) {
        fireEvent.click(friendElements[0]);
        
        // Simulate receiving a typing event
        if (mockSocketCallbacks['userTyping']) {
          act(() => {
            mockSocketCallbacks['userTyping']({
              userId: 'friend1',
              username: 'friend1',
              receiverId: mockUser.id,
              timestamp: new Date()
            });
          });
        }
      }
    });
  });
  
  // Test for socket group message event
  test('handles socket groupMessage event correctly', async () => {
    // Mock group chats data
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/groupchats/')) {
        return Promise.resolve({
          data: [
            { 
              _id: 'group1', 
              name: 'Test Group', 
              members: [
                { _id: 'test-user-id', username: 'testuser' },
                { _id: 'friend1', username: 'friend1' }
              ] 
            }
          ]
        });
      }
      return Promise.resolve({ data: [] });
    });
    
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that socket.on was called for the group message event
    expect(mockSocket.on).toHaveBeenCalledWith('newGroupMessage', expect.any(Function));
    
    // Simulate receiving a group message
    if (mockSocketCallbacks['newGroupMessage']) {
      const mockGroupMessage = {
        _id: 'new-group-message',
        sender: {
          _id: 'friend1',
          username: 'friend1'
        },
        groupChat: {
          _id: 'group1',
          name: 'Test Group'
        },
        content: 'Hello group from socket',
        createdAt: new Date().toISOString()
      };
      
      act(() => {
        mockSocketCallbacks['newGroupMessage'](mockGroupMessage);
      });
      
      // Select the group to see if the message appears
      await waitFor(() => {
        const groupElements = screen.getAllByText('Test Group');
        if (groupElements.length > 0) {
          fireEvent.click(groupElements[0]);
        }
      });
    }
  });
});
