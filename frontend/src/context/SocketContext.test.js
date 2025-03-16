import React from 'react';
import { render, screen, act as rtlAct } from '@testing-library/react';
import { act } from 'react';
import { SocketProvider, useSocket } from './SocketContext';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

// Mock console.log to prevent logs during tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock process.env
const originalNodeEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'development';
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

// Mock AuthContext with different user states
const mockUser = { id: 'test-user-id', username: 'testuser' };
let mockAuthUser = mockUser;

jest.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser
  })
}));

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
  let mockSocket;
  let connectCallback;
  let disconnectCallback;
  
  beforeEach(() => {
    // Reset mock auth user
    mockAuthUser = mockUser;
    
    // Create mock socket with all required methods
    mockSocket = {
      on: jest.fn((event, callback) => {
        // Store callbacks for later triggering
        if (event === 'connect') {
          connectCallback = callback;
        } else if (event === 'disconnect') {
          disconnectCallback = callback;
        }
      }),
      emit: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn()
    };
    
    // Reset mocks
    io.mockReset();
    io.mockReturnValue(mockSocket);
  });
  
  test('provides socket context', async () => {
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Check if socket is initialized
    expect(screen.getByTestId('socket-status')).toHaveTextContent('Socket initialized');
    
    // Verify io was called with the correct URL
    expect(io).toHaveBeenCalledWith('http://localhost:5000');
    
    // Verify socket.on was called for the connect event
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    
    // Verify socket.on was called for the disconnect event
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });
  
  test('handles socket connection event', async () => {
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Initially disconnected
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    
    // Trigger connect event
    await act(async () => {
      connectCallback();
    });
    
    // Check connection status after connect
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    
    // Check if socket emits 'register' event with user ID
    expect(mockSocket.emit).toHaveBeenCalledWith('register', 'test-user-id');
    
    // Verify console.log was called in development mode
    expect(console.log).toHaveBeenCalledWith('Socket connected');
  });
  
  test('handles socket disconnection event', async () => {
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Trigger connect event first
    await act(async () => {
      connectCallback();
    });
    
    // Should be connected
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    
    // Trigger disconnect event
    await act(async () => {
      disconnectCallback();
    });
    
    // Check connection status after disconnect
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    
    // Verify console.log was called for disconnect in development mode
    expect(console.log).toHaveBeenCalledWith('Socket disconnected');
  });
  
  test('registers user when user logs in after socket is connected', async () => {
    // Start with no user
    mockAuthUser = null;
    
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Connect socket
    await act(async () => {
      connectCallback();
    });
    
    // No register event should be emitted yet (no user)
    expect(mockSocket.emit).not.toHaveBeenCalledWith('register', expect.any(String));
    
    // Now simulate user login
    mockAuthUser = mockUser;
    
    // Trigger a re-render to simulate the user state change
    await rtlAct(async () => {
      // Force re-render by updating a state in React
      // This simulates the effect of the user changing
    });
    
    // Check if socket emits 'register' event with user ID after login
    expect(mockSocket.emit).toHaveBeenCalledWith('register', 'test-user-id');
  });
  
  test('does not register user when socket is not connected', async () => {
    // Mock implementation to not automatically connect
    mockSocket.on.mockImplementation((event, callback) => {
      // Store callbacks but don't auto-trigger
      if (event === 'connect') {
        connectCallback = callback;
      } else if (event === 'disconnect') {
        disconnectCallback = callback;
      }
    });
    
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Socket should be initialized but not connected
    expect(screen.getByTestId('socket-status')).toHaveTextContent('Socket initialized');
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
    
    // No register event should be emitted (socket not connected)
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
  
  test('cleans up socket on unmount', async () => {
    let unmount;
    
    await act(async () => {
      const renderResult = render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
      unmount = renderResult.unmount;
    });
    
    // Unmount the component
    await act(async () => {
      unmount();
    });
    
    // Verify socket.disconnect was called
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
  
  test('handles missing user gracefully', async () => {
    // Set user to null to simulate not logged in
    mockAuthUser = null;
    
    await act(async () => {
      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );
    });
    
    // Trigger connect event
    await act(async () => {
      connectCallback();
    });
    
    // Should be connected but no register event
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
