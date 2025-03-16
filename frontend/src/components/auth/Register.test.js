import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('renders register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Check if register form elements are rendered
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });
  
  test('updates form fields when user types', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Get form inputs
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    // Simulate user typing
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check if input values are updated
    expect(usernameInput.value).toBe('newuser');
    expect(passwordInput.value).toBe('password123');
  });
  
  test('calls axios and navigates on successful registration', async () => {
    // Mock successful registration
    axios.post.mockResolvedValueOnce({ data: { message: 'User registered successfully' } });
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check if axios was called with correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5001/api/auth/register',
      {
        username: 'newuser',
        password: 'password123'
      }
    );
    
    // Wait for navigation to occur
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  test('displays error message on registration failure', async () => {
    // Mock failed registration
    const errorMessage = 'Username already exists';
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: errorMessage
        }
      }
    });
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Check that navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test('handles generic error when response structure is unexpected', async () => {
    // Mock error without proper structure
    axios.post.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    
    // Check if generic error message is displayed
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });
});
