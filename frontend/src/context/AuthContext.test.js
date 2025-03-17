import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';
import { act } from 'react';

// Mock axios
jest.mock('axios');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Test component that uses the auth context
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
    updateUser({ 
      id: user.id, 
      username: 'updateduser', 
      profileImage: 'updated.jpg',
      bio: '' 
    });
  };
  
  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in as ${user.username}` : 'Not logged in'}
      </div>
      <button data-testid="login-button" onClick={handleLogin}>
        Login
      </button>
      <button data-testid="logout-button" onClick={handleLogout}>
        Logout
      </button>
      <button data-testid="update-button" onClick={handleUpdateUser}>
        Update User
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset axios mocks
    axios.post.mockReset();
  });
  
  test('provides auth context with initial state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state should be not logged in
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
  });
  
  test('loads user from localStorage on init', async () => {
    // Mock user in localStorage
    const storedUser = { 
      id: '123', 
      username: 'testuser', 
      profileImage: 'test.jpg',
      bio: '' 
    };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedUser));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should show logged in status with username from localStorage
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
  });
  
  test('handles login success', async () => {
    // Mock successful login response
    const apiResponse = { 
      _id: '123', 
      username: 'testuser', 
      profileImage: 'test.jpg',
      bio: '' 
    };
    
    // The expected user object that will be stored
    const expectedUserObject = {
      id: apiResponse._id,
      username: apiResponse.username,
      profileImage: apiResponse.profileImage,
      bio: apiResponse.bio
    };
    
    axios.post.mockResolvedValueOnce({
      data: apiResponse
    });
    
    // Create a test component that uses the login function
    const TestLoginComponent = () => {
      const { login, user } = useAuth();
      
      const handleLogin = async () => {
        try {
          await login({ username: 'testuser', password: 'password123' });
        } catch (error) {
          console.error('Login failed:', error);
        }
      };
      
      return (
        <div>
          <div data-testid="user-status">
            {user ? `Logged in as ${user.username}` : 'Not logged in'}
          </div>
          <button data-testid="login-button" onClick={handleLogin}>
            Login
          </button>
        </div>
      );
    };
    
    // Render the component
    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );
    
    // Check initial state
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for login to complete and state to update
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        {
          username: 'testuser',
          password: 'password123'
        }
      );
    });
    
    // Wait for state to update
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
    });
    
    // Check that user data is stored in localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify(expectedUserObject)
    );
  });
  
  test('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({ 
      response: { data: { message: errorMessage } } 
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    fireEvent.click(screen.getByTestId('login-button'));
    
    // User should still be not logged in
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Check API call
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/login',
      {
        username: 'testuser',
        password: 'password123'
      }
    );
    
    // localStorage should not be called
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });
  
  test('handles logout', async () => {
    // Mock initial logged in state
    const storedUser = { 
      id: '123', 
      username: 'testuser', 
      profileImage: 'test.jpg',
      bio: '' 
    };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(storedUser));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should show logged in initially
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
    
    // Click logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Should show logged out after clicking logout
    expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    
    // Check that localStorage.removeItem was called
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
  });
  
  test('handles user update', async () => {
    // Mock initial logged in state
    const initialUser = { 
      id: '123', 
      username: 'testuser', 
      profileImage: 'test.jpg',
      bio: '' 
    };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(initialUser));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as testuser');
    
    // Click update button
    fireEvent.click(screen.getByTestId('update-button'));
    
    // User should be updated
    expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as updateduser');
    
    // Check that localStorage.setItem was called with updated user
    const updatedUser = { 
      id: '123', 
      username: 'updateduser', 
      profileImage: 'updated.jpg',
      bio: '' 
    };
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
  });
});
