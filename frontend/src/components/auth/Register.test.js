import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
  
  test('handles successful registration', async () => {
    // Mock successful registration
    axios.post.mockResolvedValueOnce({ data: { message: 'User registered successfully' } });
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Wait for the API call to be made
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        { username: 'testuser', password: 'password123' }
      );
    });
    
    // Check that navigation to login page occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  test('handles registration error', async () => {
    // Mock registration error
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Username already exists' } }
    });
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'existinguser' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
    
    // Verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test('handles generic error', async () => {
    // Mock error without proper structure
    axios.post.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Wait for the generic error message
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
    
    // Verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
