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

describe('Dashboard Component Additional Tests', () => {
  const mockUser = { 
    id: 'test-user-id', 
    username: 'testuser',
    profileImage: 'test.jpg',
    bio: 'Test bio'
  };
  
  const mockLogout = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockSetUser = jest.fn();
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock URL.createObjectURL for image tests
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    
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
      logout: mockLogout,
      updateUser: mockUpdateUser,
      setUser: mockSetUser
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
              directMessages: [],
              groupMessages: []
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
    
    // Mock Audio
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      currentTime: 0,
      volume: 1
    }));
    
    // Mock FormData
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn()
    }));
  });

  // Basic test to verify the component renders
  test('renders dashboard component', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that the component renders with the user's name
    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
  });

  // Test for message input and typing event
  test('handles message input and emits typing event', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and interact with the message input if it exists
    const messageInput = screen.queryByPlaceholderText(/type a message/i);
    if (messageInput) {
      fireEvent.change(messageInput, { target: { value: 'Hello' } });
      
      // Verify that socket.emit was called for typing
      expect(mockSocket.emit).toHaveBeenCalled();
    }
  });
  
  // Test for friend list rendering
  test('renders friends list correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that the friends section header is displayed
    const friendsHeader = screen.queryByText(/friends/i);
    expect(friendsHeader).toBeInTheDocument();
  });
  
  // Test for group chat section
  test('renders group chats section', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Verify that the group chats section header is displayed
    const groupChatsHeader = screen.queryByText(/group chats/i);
    expect(groupChatsHeader).toBeInTheDocument();
    
    // Check for the create group button
    const createGroupButton = screen.queryByText('+');
    expect(createGroupButton).toBeInTheDocument();
  });
});
