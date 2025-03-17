import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SocketProvider, useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

// Mock dependencies
jest.mock('socket.io-client');
jest.mock('./AuthContext');

// Mock process.env
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Test component that uses the socket context
const TestComponent = () => {
  const { socket, isConnected } = useSocket();
  
  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="socket-status">
        {socket ? 'Socket initialized' : 'No socket'}
      </div>
    </div>
  );
};

describe('SocketContext', () => {
  // Create mock socket before each test
  let mockSocket;
  
  beforeEach(() => {
    // Create a fresh mock socket for each test
    mockSocket = {
      on: jest.fn((event, callback) => {
        // Store the callback for later triggering
        if (event === 'connect' && callback) {
          // Immediately call the connect callback
          callback();
        }
        return mockSocket;
      }),
      emit: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
      connected: true
    };
    
    // Reset io mock to return our fresh mock socket
    io.mockImplementation(() => mockSocket);
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock for useAuth
    useAuth.mockReturnValue({
      user: null
    });
  });
  
  test('should not initialize socket when user is not logged in', () => {
    // Mock user as null (not logged in)
    useAuth.mockReturnValue({
      user: null
    });
    
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Check that socket is not initialized
    expect(io).not.toHaveBeenCalled();
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(screen.getByTestId('socket-status')).toHaveTextContent('No socket');
  });
  
  test('should initialize socket when user is logged in', async () => {
    // Mock user as logged in
    const mockUser = { id: 'test-user-id', username: 'testuser' };
    useAuth.mockReturnValue({
      user: mockUser
    });
    
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Check that socket is initialized with correct params
    expect(io).toHaveBeenCalledWith('http://localhost:5000', {
      query: { userId: 'test-user-id' }
    });
    
    // Wait for the socket to connect and state to update
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    });
    expect(screen.getByTestId('socket-status')).toHaveTextContent('Socket initialized');
  });
  
  test('should emit register event when socket connects', async () => {
    // Mock user as logged in
    const mockUser = { id: 'test-user-id', username: 'testuser' };
    useAuth.mockReturnValue({
      user: mockUser
    });
    
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );
    
    // Wait for the register event to be emitted
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('register', 'test-user-id');
    });
  });
});
