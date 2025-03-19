// Import necessary testing utilities
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';

// Import the Dashboard component
import Dashboard from './Dashboard';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Mock dependencies
jest.mock('axios');
jest.mock('../context/AuthContext');
jest.mock('../context/SocketContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock the fetchUnreadCounts function to prevent the error
jest.mock('../components/Dashboard', () => {
  const originalModule = jest.requireActual('../components/Dashboard');
  return {
    __esModule: true,
    default: function MockDashboard(props) {
      const DashboardComponent = originalModule.default;
      return <DashboardComponent {...props} />;
    }
  };
});

describe('Dashboard Component Function Tests', () => {
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
      } else if (url.includes('/api/messages/unread/')) {
        return Promise.resolve({
          data: {
            directMessages: [
              { senderId: 'friend1', count: 3 },
              { senderId: 'friend2', count: 1 }
            ],
            groupMessages: [
              { groupId: 'group1', count: 2 }
            ]
          }
        });
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

  // Test for fetchFriends function
  test('fetchFriends function makes correct API call', async () => {
    render(<Dashboard />);
    
    // Wait for the API call to be made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:5000/api/friends/${mockUser.id}`);
    });
  });

  // Test for fetchUnreadCounts function
  test('fetchUnreadCounts function makes correct API call', async () => {
    render(<Dashboard />);
    
    // Wait for the API call to be made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:5000/api/messages/unread/${mockUser.id}`);
    });
  });

  // Test for sendMessage function
  test('sendMessage function makes correct API call', async () => {
    // Mock the implementation of sendMessage
    axios.post.mockImplementation((url, data) => {
      if (url.includes('/api/messages/send')) {
        return Promise.resolve({ 
          data: { 
            _id: 'new-message-id',
            sender: mockUser.id,
            receiver: 'friend1',
            content: 'Hello, friend!',
            createdAt: new Date().toISOString()
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    // Render the component
    render(<Dashboard />);
    
    // Set up the component state for sending a message
    // We need to select a friend first
    const friendElements = await screen.findAllByTestId('friend-item');
    fireEvent.click(friendElements[0]);
    
    // Find the message form and input
    const messageForm = await screen.findByTestId('message-form');
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    
    // Type a message
    fireEvent.change(messageInput, { target: { value: 'Hello, friend!' } });
    
    // Submit the form
    fireEvent.submit(messageForm);
    
    // Wait for the API call to be made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      const calls = axios.post.mock.calls;
      const matchingCall = calls.find(call => 
        call[0] === 'http://localhost:5000/api/messages/send'
      );
      expect(matchingCall).toBeTruthy();
    });
  });
});
