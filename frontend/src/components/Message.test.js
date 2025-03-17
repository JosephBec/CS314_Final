import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import Message from './Message';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Mock dependencies
jest.mock('../context/AuthContext');
jest.mock('axios');

// Mock Date.now to have consistent time-based tests
const mockNow = 1609459200000; // 2021-01-01T00:00:00.000Z
const realDateNow = Date.now.bind(global.Date);

describe('Message Component', () => {
  const mockUser = { id: 'user123', username: 'testuser' };
  const mockOnMessageDelete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth context
    useAuth.mockReturnValue({
      user: mockUser
    });
    
    // Mock axios
    axios.delete.mockResolvedValue({});
    
    // Mock Date.now
    global.Date.now = jest.fn(() => mockNow);
  });
  
  afterEach(() => {
    // Restore Date.now
    global.Date.now = realDateNow;
  });
  
  test('renders own message correctly', () => {
    const message = {
      _id: 'msg123',
      content: 'Hello, world!',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Check if message content is displayed
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    
    // Check if message has the correct class for sent messages
    const messageWrapper = screen.getByText('Hello, world!').closest('.message-wrapper');
    expect(messageWrapper).toHaveClass('sent');
    
    // Check if profile image is displayed
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toHaveAttribute('src', '/profile.jpg');
  });
  
  test('renders received message correctly', () => {
    const message = {
      _id: 'msg456',
      content: 'Hi there!',
      sender: { _id: 'other123', username: 'otheruser', profileImage: '/other-profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Check if message content is displayed
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    
    // Check if message has the correct class for received messages
    const messageWrapper = screen.getByText('Hi there!').closest('.message-wrapper');
    expect(messageWrapper).toHaveClass('received');
    
    // Check if profile image is displayed
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toHaveAttribute('src', '/other-profile.jpg');
  });
  
  test('renders message with image correctly', () => {
    const message = {
      _id: 'msg789',
      imageUrl: '/test-image.jpg',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Check if image is displayed
    const messageImage = screen.getByAltText('Message attachment');
    expect(messageImage).toHaveAttribute('src', '/test-image.jpg');
  });
  
  test('shows unsend button for recent own messages', () => {
    const message = {
      _id: 'msg123',
      content: 'Hello, world!',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 30000).toISOString(), // 30 seconds ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Check if unsend button is displayed
    const unsendButton = screen.getByTitle(/Unsend/);
    expect(unsendButton).toBeInTheDocument();
  });
  
  test('does not show unsend button for old own messages', () => {
    const message = {
      _id: 'msg123',
      content: 'Hello, world!',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Check that unsend button is not displayed
    expect(screen.queryByTitle(/Unsend/)).not.toBeInTheDocument();
  });
  
  test('calls onMessageDelete when unsend button is clicked', async () => {
    const message = {
      _id: 'msg123',
      content: 'Hello, world!',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 30000).toISOString(), // 30 seconds ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Click unsend button
    const unsendButton = screen.getByTitle(/Unsend/);
    act(() => {
      fireEvent.click(unsendButton);
    });
    
    // Wait for axios.delete to be called
    await act(async () => {
      await Promise.resolve();
    });
    
    // Check if axios.delete was called with the correct URL
    expect(axios.delete).toHaveBeenCalledWith(`http://localhost:5000/api/messages/unsend/${message._id}`);
    
    // Check if onMessageDelete was called with the message ID
    expect(mockOnMessageDelete).toHaveBeenCalledWith(message._id);
  });
  
  test('handles image load error', () => {
    const message = {
      _id: 'msg789',
      imageUrl: '/test-image.jpg',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Get the message image
    const messageImage = screen.getByAltText('Message attachment');
    
    // Simulate error
    act(() => {
      fireEvent.error(messageImage);
    });
    
    // Check if the style was updated
    expect(messageImage.style.display).toBe('none');
  });
  
  test('handles profile image load error', () => {
    const message = {
      _id: 'msg123',
      content: 'Hello, world!',
      sender: { _id: 'user123', username: 'testuser', profileImage: '/profile.jpg' },
      createdAt: new Date(mockNow - 120000).toISOString(), // 2 minutes ago
      readBy: []
    };
    
    act(() => {
      render(
        <Message 
          message={message} 
          currentUser={mockUser}
          onMessageDelete={mockOnMessageDelete} 
        />
      );
    });
    
    // Get the profile image
    const profileImage = screen.getByAltText('Profile');
    
    // Simulate error
    act(() => {
      fireEvent.error(profileImage);
    });
    
    // Check if the src was updated to default
    expect(profileImage).toHaveAttribute('src', '/default-avatar.png');
  });
});
