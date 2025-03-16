import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] ? store[key] : null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
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
  value: mockLocalStorage
});

// Test component that uses auth context and exposes login/logout functionality
const TestComponent = () => {
  const { user, login, logout, updateUser } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login({ username: 'testuser', password: 'password123' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const handleUpdateUser = () => {
    updateUser({ bio: 'Updated bio' });
  };
  
  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </div>
      {user && (
        <div data-testid="user-details">
          ID: {user.id}, Profile: {user.profileImage}, Bio: {user.bio || 'No bio'}
        </div>
      )}
      <button onClick={handleLogin} data-testid="login-button">Login</button>
      <button onClick={handleLogout} data-testid="logout-button">Logout</button>
      <button onClick={handleUpdateUser} data-testid="update-button">Update Bio</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });
  
  test('provides initial auth state when not logged in', async () => {
    // Ensure localStorage.getItem returns null for 'user'
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Check initial state (not logged in)
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
  });
  
  test('loads user from localStorage on initialization', async () => {
    // Set up mock localStorage return value
    const storedUser = {
      id: '123',
      username: 'storeduser',
      profileImage: 'stored.jpg',
      bio: 'Stored bio'
    };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedUser));
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Check that user is loaded from localStorage
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as storeduser');
    expect(screen.getByTestId('user-details')).toHaveTextContent('ID: 123');
    expect(screen.getByTestId('user-details')).toHaveTextContent('Profile: stored.jpg');
    expect(screen.getByTestId('user-details')).toHaveTextContent('Bio: Stored bio');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
  });
  
  test('handles login successfully', async () => {
    // Mock successful login response
    const loginResponse = {
      data: {
        _id: 'login123',
        username: 'loginuser',
        profileImage: 'login.jpg',
        bio: 'Login bio'
      }
    };
    axios.post.mockResolvedValueOnce(loginResponse);
    
    // Ensure localStorage.getItem returns null for 'user'
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Initial state should be not logged in
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Click login button
    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'));
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/login',
        { username: 'testuser', password: 'password123' }
      );
    });
    
    // Check that user state is updated
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as loginuser');
    expect(screen.getByTestId('user-details')).toHaveTextContent('ID: login123');
    
    // Check that user is stored in localStorage
    const expectedUser = {
      id: 'login123',
      username: 'loginuser',
      profileImage: 'login.jpg',
      bio: 'Login bio'
    };
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(expectedUser)
    );
  });
  
  test('handles login failure', async () => {
    // Mock failed login response
    const errorResponse = {
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    };
    axios.post.mockRejectedValueOnce(errorResponse);
    
    // Ensure localStorage.getItem returns null for 'user'
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    // Spy on console.error to verify it's called
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Click login button
    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'));
    });
    
    // Wait for login attempt to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/login',
        { username: 'testuser', password: 'password123' }
      );
    });
    
    // Check that error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // User should still be logged out
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Clean up spy
    consoleErrorSpy.mockRestore();
  });
  
  test('handles logout', async () => {
    // Set up mock localStorage return value for initial logged in state
    const storedUser = {
      id: '123',
      username: 'storeduser',
      profileImage: 'stored.jpg',
      bio: 'Stored bio'
    };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedUser));
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Initial state should be logged in
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as storeduser');
    
    // Click logout button
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-button'));
    });
    
    // Check that user is logged out
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Check that user is removed from localStorage
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
  });
  
  test('handles updateUser', async () => {
    // Set up mock localStorage return value for initial logged in state
    const storedUser = {
      id: '123',
      username: 'storeduser',
      profileImage: 'stored.jpg'
    };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedUser));
    
    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    // Initial state should be logged in with no bio
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as storeduser');
    expect(screen.getByTestId('user-details')).toHaveTextContent('Bio: No bio');
    
    // Click update button
    await act(async () => {
      fireEvent.click(screen.getByTestId('update-button'));
    });
    
    // Check that user is updated with new bio
    expect(screen.getByTestId('user-details')).toHaveTextContent('Bio: Updated bio');
    
    // Check that updated user is stored in localStorage
    const expectedUpdatedUser = {
      ...storedUser,
      bio: 'Updated bio'
    };
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(expectedUpdatedUser)
    );
  });
});
