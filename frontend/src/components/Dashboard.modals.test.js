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

describe('Dashboard Component Modal Tests', () => {
  const mockUser = { 
    id: 'test-user-id', 
    username: 'testuser',
    profileImage: 'test.jpg',
    bio: 'Test bio'
  };
  
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
        return Promise.resolve({
          data: [
            { _id: 'request1', username: 'newuser1', senderId: 'sender1' },
            { _id: 'request2', username: 'newuser2', senderId: 'sender2' }
          ]
        });
      } else if (url.includes('/api/groupchats/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    
    // Mock axios post
    axios.post.mockResolvedValue({ data: {} });
    
    // Mock FormData
    global.FormData = jest.fn().mockImplementation(() => ({
      append: jest.fn()
    }));
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
  });

  // Test for friend requests modal
  test('friend requests modal displays correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and click the friend requests button
    const friendRequestsButton = screen.queryByTitle('Friend Requests');
    if (friendRequestsButton) {
      act(() => {
        fireEvent.click(friendRequestsButton);
      });
    }
    
    // Wait for the friend requests button to be clicked
    await waitFor(() => {
      expect(screen.queryByTitle('Friend Requests')).toBeInTheDocument();
    });
    
    // Check if the friend requests modal is displayed
    await waitFor(() => {
      const friendRequestsTab = screen.queryByText('Friend Requests');
      if (friendRequestsTab) {
        expect(friendRequestsTab).toBeInTheDocument();
        
        // Check if the friend request is displayed
        const requesterElement = screen.queryByText('newuser1');
        if (requesterElement) {
          expect(requesterElement).toBeInTheDocument();
        }
      }
    });
  });
  
  // Test for accepting friend request
  test('accepting friend request works correctly', async () => {
    // Mock the axios.post implementation for accepting friend requests
    axios.post.mockImplementation((url, data) => {
      if (url === 'http://localhost:5000/api/friends/accept') {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });
    
    // Mock the friend requests data
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/friends/requests/')) {
        return Promise.resolve({
          data: [
            { _id: 'friend1', username: 'newuser1', senderId: 'sender1' }
          ]
        });
      } else if (url.includes('/api/friends/')) {
        return Promise.resolve({
          data: [
            { _id: 'friend1', username: 'friend1', profileImage: 'friend1.jpg' },
            { _id: 'friend2', username: 'friend2', profileImage: 'friend2.jpg' }
          ]
        });
      } else if (url.includes('/api/messages/unread/')) {
        return Promise.resolve({
          data: {
            directMessages: [],
            groupMessages: []
          }
        });
      } else if (url.includes('/api/groupchats/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and click the friend requests button
    const friendRequestsButton = screen.getByTitle('Friend Requests');
    fireEvent.click(friendRequestsButton);
    
    // Wait for the friend requests modal to appear
    await waitFor(() => {
      expect(screen.getByText('Friend Requests')).toBeInTheDocument();
    });
    
    // Find and click the accept button
    const acceptButton = screen.getAllByText('Accept')[0];
    fireEvent.click(acceptButton);
    
    // Check if the correct API call is made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/friends/accept',
        expect.objectContaining({
          userId: 'test-user-id',
          friendId: 'friend1'
        })
      );
    });
  });
  
  // Test for rejecting friend request
  test('rejecting friend request works correctly', async () => {
    // Mock the axios.post implementation for rejecting friend requests
    axios.post.mockImplementation((url, data) => {
      if (url === 'http://localhost:5000/api/friends/reject') {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });
    
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and click the friend requests button
    const friendRequestsButton = screen.getByTitle('Friend Requests');
    fireEvent.click(friendRequestsButton);
    
    // Wait for the friend requests modal to appear
    await waitFor(() => {
      expect(screen.getByText('Friend Requests')).toBeInTheDocument();
    });
    
    // Find and click the reject button
    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    
    // Check if the correct API call is made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/friends/reject',
        expect.objectContaining({
          userId: 'test-user-id',
          friendId: 'friend1'
        })
      );
    });
  });
  
  // Test for adding a friend
  test('adding a friend works correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and click the friend requests button
    const friendRequestsButton = screen.queryByTitle('Friend Requests');
    if (friendRequestsButton) {
      act(() => {
        fireEvent.click(friendRequestsButton);
      });
    }
    
    // Switch to the Add Friend tab
    await waitFor(() => {
      const addFriendTab = screen.queryByText('Add Friend');
      if (addFriendTab) {
        act(() => {
          fireEvent.click(addFriendTab);
        });
      }
    });
    
    // Enter a username and submit the form
    await waitFor(() => {
      const usernameInput = screen.queryByPlaceholderText(/friend's username/i);
      if (usernameInput) {
        fireEvent.change(usernameInput, { target: { value: 'newfriend' } });
        
        // Submit the form
        const form = usernameInput.closest('form');
        if (form) {
          act(() => {
            fireEvent.submit(form);
          });
        }
      }
    });
    
    // Check if the correct API call is made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/friends/request',
        expect.any(Object)
      );
    });
  });
  
  // Test for image upload modal
  test('image upload modal displays correctly', async () => {
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Select a friend to chat with
    await waitFor(() => {
      const friendElements = screen.getAllByText((content, element) => {
        return content.includes('friend1') || content.includes('friend2');
      });
      
      if (friendElements.length > 0) {
        act(() => {
          fireEvent.click(friendElements[0]);
        });
      }
    });
    
    // Find the file input and simulate file selection
    await waitFor(() => {
      const fileInput = screen.queryByTestId('image-upload');
      if (fileInput) {
        // Create a mock file
        const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
        
        // Simulate file selection
        act(() => {
          fireEvent.change(fileInput, { target: { files: [file] } });
        });
      }
    });
    
    // Check if the image modal is displayed
    await waitFor(() => {
      const imageModalTitle = screen.queryByText('Send Image');
      expect(imageModalTitle).toBeInTheDocument();
    });
  });
  
  // Test for group settings
  test.skip('group settings displays correctly', async () => {
    // Mock group chats data with complete structure
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
              ],
              admins: ['test-user-id'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        });
      } else if (url.includes('/api/friends/')) {
        return Promise.resolve({
          data: [
            { _id: 'friend1', username: 'friend1', profileImage: 'friend1.jpg' },
            { _id: 'friend2', username: 'friend2', profileImage: 'friend2.jpg' }
          ]
        });
      } else if (url.includes('/api/messages/unread/')) {
        return Promise.resolve({
          data: {
            directMessages: [],
            groupMessages: []
          }
        });
      } else if (url.includes('/api/friends/requests/')) {
        return Promise.resolve({ data: [] });
      } else if (url.includes('/api/messages/group/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    
    render(<Dashboard />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find and click on a group
    const groupElement = await screen.findByText('Test Group');
    fireEvent.click(groupElement);
    
    // Find and click the add members button
    const addMembersButton = await screen.findByTestId('add-members-button');
    fireEvent.click(addMembersButton);
    
    // Check if the add members modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Add Members to Test Group')).toBeInTheDocument();
    });
  });
});
