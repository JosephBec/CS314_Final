import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; 
import Dashboard from './Dashboard';
import axios from 'axios';

// Mock all dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

// Mock axios with specific responses for each endpoint
jest.mock('axios');

// Mock contexts
const mockLogout = jest.fn();
const mockUpdateUser = jest.fn();
const mockSetUser = jest.fn();
const mockUser = { 
  id: 'test-user-id', 
  username: 'testuser',
  profileImage: 'profile.jpg',
  bio: 'Test bio'
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    updateUser: mockUpdateUser,
    setUser: mockSetUser
  })
}));

// Mock socket events and handlers
const socketEventHandlers = {};
const mockSocket = {
  on: jest.fn((event, callback) => {
    socketEventHandlers[event] = callback;
    return mockSocket;
  }),
  off: jest.fn(),
  emit: jest.fn()
};

jest.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    socket: mockSocket,
    isConnected: true
  })
}));

// Mock child components
jest.mock('./Settings', () => () => <div data-testid="settings-component">Settings Component</div>);
jest.mock('./Message', () => ({ message, currentUser, onUnsend }) => (
  <div data-testid="message-component">
    <span>{message.content}</span>
    <button onClick={() => onUnsend(message._id)}>Unsend</button>
  </div>
));

// Mock browser APIs
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.URL.createObjectURL = jest.fn(() => 'mock-url');
window.URL.revokeObjectURL = jest.fn();

// Mock Audio
const mockAudio = {
  play: jest.fn(),
  volume: 0
};
global.Audio = jest.fn(() => mockAudio);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper function to render component with act
const renderWithAct = async (component) => {
  let renderResult;
  await act(async () => {
    renderResult = render(component);
  });
  return renderResult;
};

// Helper function to click an element with act
const clickWithAct = async (element) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

// Helper function to change input value with act
const changeWithAct = async (element, value) => {
  await act(async () => {
    fireEvent.change(element, { target: { value } });
  });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup axios mock responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/friends')) {
        return Promise.resolve({ 
          data: [
            { _id: 'friend1', username: 'friend1', profileImage: 'friend1.jpg' },
            { _id: 'friend2', username: 'friend2', profileImage: 'friend2.jpg' }
          ] 
        });
      }
      if (url.includes('/friend-requests')) {
        return Promise.resolve({ 
          data: [
            { _id: 'request1', username: 'request1', profileImage: 'request1.jpg' }
          ] 
        });
      }
      if (url.includes('/messages')) {
        return Promise.resolve({ 
          data: [
            { 
              _id: 'msg1', 
              sender: 'friend1', 
              receiver: 'test-user-id',
              content: 'Hello there!',
              timestamp: new Date().toISOString(),
              senderUsername: 'friend1',
              senderProfileImage: 'friend1.jpg'
            }
          ] 
        });
      }
      if (url.includes('/groups')) {
        return Promise.resolve({ 
          data: [
            { 
              _id: 'group1', 
              name: 'Test Group', 
              members: ['test-user-id', 'friend1', 'friend2'],
              creator: 'test-user-id'
            }
          ] 
        });
      }
      if (url.includes('/group-messages')) {
        return Promise.resolve({ 
          data: [
            { 
              _id: 'gmsg1', 
              sender: 'friend1',
              groupId: 'group1',
              content: 'Group message',
              timestamp: new Date().toISOString(),
              senderUsername: 'friend1',
              senderProfileImage: 'friend1.jpg'
            }
          ] 
        });
      }
      if (url.includes('/unread-counts')) {
        return Promise.resolve({ 
          data: { 
            counts: {
              friend1: 2,
              group_group1: 3
            } 
          } 
        });
      }
      return Promise.resolve({ data: [] });
    });
    
    axios.post.mockResolvedValue({ data: { success: true } });
    axios.delete = jest.fn().mockResolvedValue({ data: { success: true } });
    
    // Suppress console errors for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  test('renders without crashing', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
  });
  
  test('displays friend list after loading', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Check if friends are displayed
    await waitFor(() => {
      expect(screen.getByText('friend1')).toBeInTheDocument();
      expect(screen.getByText('friend2')).toBeInTheDocument();
    });
  });
  
  test('displays friend requests after loading', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friend-requests/test-user-id');
    });
    
    // Find and click friend requests button
    const friendRequestsButtons = screen.getAllByRole('button').filter(button => 
      button.textContent.includes('Friend Requests')
    );
    
    if (friendRequestsButtons.length > 0) {
      await clickWithAct(friendRequestsButtons[0]);
    }
    
    // Check if friend requests are displayed
    await waitFor(() => {
      expect(screen.getByText('request1')).toBeInTheDocument();
    });
  });
  
  test('displays messages when selecting a friend', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Click on a friend to select them
    await clickWithAct(screen.getByText('friend1'));
    
    // Check if messages are loaded
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/messages/test-user-id/friend1');
    });
    
    // Check if message is displayed
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });
  });
  
  test('handles sending a new message', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Click on a friend to select them
    await clickWithAct(screen.getByText('friend1'));
    
    // Find message input and type a message
    const messageInputs = screen.getAllByRole('textbox');
    const messageInput = messageInputs.find(input => 
      input.placeholder === 'Type a message...'
    );
    
    if (messageInput) {
      await changeWithAct(messageInput, 'New test message');
    }
    
    // Find and click send button
    const sendButtons = screen.getAllByRole('button').filter(button => 
      button.textContent.includes('Send')
    );
    
    if (sendButtons.length > 0) {
      await clickWithAct(sendButtons[0]);
    }
    
    // Check if message was sent via API
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/messages',
        expect.objectContaining({
          sender: 'test-user-id',
          receiver: 'friend1',
          content: 'New test message'
        })
      );
    });
  });
  
  test('handles accepting a friend request', async () => {
    // Mock the axios.post for accepting friend request
    axios.post.mockImplementation((url) => {
      if (url.includes('/accept-friend-request')) {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });
    
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friend-requests/test-user-id');
    });
    
    // Find and click friend requests button
    const friendRequestsButtons = screen.getAllByRole('button').filter(button => 
      button.textContent.includes('Friend Requests')
    );
    
    if (friendRequestsButtons.length > 0) {
      await clickWithAct(friendRequestsButtons[0]);
    }
    
    // Find and click accept button
    const acceptButtons = screen.getAllByRole('button').filter(button => 
      button.textContent.includes('Accept')
    );
    
    if (acceptButtons.length > 0) {
      await clickWithAct(acceptButtons[0]);
    }
    
    // Check if accept API was called
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/accept-friend-request',
        expect.objectContaining({
          userId: 'test-user-id',
          friendId: expect.any(String)
        })
      );
    });
  });
  
  test('handles socket message events', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Click on a friend to select them
    await clickWithAct(screen.getByText('friend1'));
    
    // Simulate receiving a message via socket
    await act(async () => {
      if (socketEventHandlers['newMessage']) {
        socketEventHandlers['newMessage']({
          _id: 'socket-msg1',
          sender: { _id: 'friend1' },
          receiver: { _id: 'test-user-id' },
          content: 'Socket message',
          timestamp: new Date().toISOString(),
          senderUsername: 'friend1',
          senderProfileImage: 'friend1.jpg'
        });
      }
    });
    
    // Check if the new message is displayed
    await waitFor(() => {
      expect(screen.getByText('Socket message')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
  
  test('handles unsending a message', async () => {
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Click on a friend to select them
    await clickWithAct(screen.getByText('friend1'));
    
    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });
    
    // Find and click unsend button
    const unsendButton = screen.getByText('Unsend');
    await clickWithAct(unsendButton);
    
    // Check if unsend API was called
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/api/messages/msg1');
    });
  });
  
  test('handles error when sending message fails', async () => {
    // Mock axios post to fail
    axios.post.mockRejectedValueOnce(new Error('Failed to send message'));
    
    await renderWithAct(<Dashboard />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/friends/test-user-id');
    });
    
    // Click on a friend to select them
    await clickWithAct(screen.getByText('friend1'));
    
    // Find message input and type a message
    const messageInputs = screen.getAllByRole('textbox');
    const messageInput = messageInputs.find(input => 
      input.placeholder === 'Type a message...'
    );
    
    if (messageInput) {
      await changeWithAct(messageInput, 'Message that will fail');
    }
    
    // Find and click send button
    const sendButtons = screen.getAllByRole('button').filter(button => 
      button.textContent.includes('Send')
    );
    
    if (sendButtons.length > 0) {
      await clickWithAct(sendButtons[0]);
    }
    
    // Check if error is displayed (looking for any error-related text)
    await waitFor(() => {
      const errorElements = screen.getAllByText(/failed|error/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
