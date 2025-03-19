import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { AuthContext } from '../context/AuthContext';
import SocketContext from '../context/SocketContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
};

// Mock context values
const mockUser = {
  id: 'user123',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  profileImage: '/test-profile.jpg',
  bio: 'Test bio'
};

const mockAuthContext = {
  user: mockUser,
  setUser: jest.fn(),
  isAuthenticated: true,
  loading: false,
  logout: jest.fn()
};

const mockSocketContext = {
  socket: mockSocket,
  isConnected: true
};

describe('Dashboard Name Display Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/friends/')) {
        return Promise.resolve({
          data: [
            {
              _id: 'friend1',
              username: 'friend1',
              firstName: 'Friend',
              lastName: 'One',
              profileImage: '/friend1.jpg'
            },
            {
              _id: 'friend2',
              username: 'friend2',
              firstName: 'Friend',
              lastName: 'Two',
              profileImage: '/friend2.jpg'
            },
            {
              _id: 'friend3',
              username: 'friend3',
              // No first or last name to test fallback
              profileImage: '/friend3.jpg'
            }
          ]
        });
      } else if (url.includes('/api/friends/requests/')) {
        return Promise.resolve({
          data: [
            {
              _id: 'request1',
              username: 'request1',
              firstName: 'Request',
              lastName: 'One'
            }
          ]
        });
      } else if (url.includes('/api/groupchats')) {
        return Promise.resolve({ data: [] });
      } else if (url.includes('/api/messages/unread/')) {
        return Promise.resolve({
          data: {
            directMessages: [],
            groupMessages: []
          }
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  const renderDashboard = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        <SocketContext.Provider value={mockSocketContext}>
          <Dashboard />
        </SocketContext.Provider>
      </AuthContext.Provider>
    );
  };

  test('displays user first and last name in header', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });
  });

  test('displays friends with first and last names', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.getByText('Friend Two')).toBeInTheDocument();
      expect(screen.getByText('@friend1')).toBeInTheDocument();
      expect(screen.getByText('@friend2')).toBeInTheDocument();
    });
  });

  test('displays username as fallback when no first/last name', async () => {
    renderDashboard();
    
    await waitFor(() => {
      // Friend3 has no first/last name, so username should be shown
      expect(screen.getByText('@friend3')).toBeInTheDocument();
    });
  });

  test('displays first and last name in friend requests', async () => {
    renderDashboard();
    
    // Open friend requests modal
    const addFriendButton = screen.getByTestId('add-friend-button');
    fireEvent.click(addFriendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Request One')).toBeInTheDocument();
      expect(screen.getByText('@request1')).toBeInTheDocument();
    });
  });

  test('renders friends list', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Friends')).toBeInTheDocument();
      expect(screen.getByText('Friend One')).toBeInTheDocument();
      expect(screen.getByText('Friend Two')).toBeInTheDocument();
      expect(screen.getByText('@friend3')).toBeInTheDocument();
    });
  });
});

// Test the name display logic directly
describe('Name Display Logic Tests', () => {
  
  // Test function to simulate the name display logic from Dashboard.js
  const getDisplayName = (user) => {
    return user.firstName || user.lastName ? 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
      user.username;
  };
  
  test('displays first and last name when both are available', () => {
    const user = {
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };
    
    expect(getDisplayName(user)).toBe('Test User');
  });
  
  test('displays first name only when last name is missing', () => {
    const user = {
      username: 'testuser',
      firstName: 'Test',
      lastName: ''
    };
    
    expect(getDisplayName(user)).toBe('Test');
  });
  
  test('displays last name only when first name is missing', () => {
    const user = {
      username: 'testuser',
      firstName: '',
      lastName: 'User'
    };
    
    expect(getDisplayName(user)).toBe('User');
  });
  
  test('falls back to username when both first and last name are missing', () => {
    const user = {
      username: 'testuser',
      firstName: '',
      lastName: ''
    };
    
    expect(getDisplayName(user)).toBe('testuser');
  });
  
  test('falls back to username when first and last name are undefined', () => {
    const user = {
      username: 'testuser'
    };
    
    expect(getDisplayName(user)).toBe('testuser');
  });
});
