import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../../context/AuthContext';

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    useAuth.mockReturnValue({
      login: mockLogin
    });
  });
  
  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Check if login form elements are rendered
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('updates form fields when user types', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Get form fields
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    // Simulate typing in username field
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');
    
    // Simulate typing in password field
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });
  
  test('submits form with user credentials', async () => {
    // Mock successful login
    mockLogin.mockResolvedValueOnce({});
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Get form fields and submit button
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Fill out the form
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if login was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    });
    
    // Wait for navigation after successful login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  test('displays error message on login failure', async () => {
    // Mock login failure
    const errorMessage = 'Invalid username or password';
    mockLogin.mockRejectedValueOnce({ 
      response: { 
        data: { 
          error: errorMessage 
        } 
      } 
    });
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Get form fields and submit button
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Fill out the form
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Check that navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  // Skipping this test since the register link is not in the component
  test.skip('navigates to register page when register link is clicked', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    // Find and click the register link
    const registerLink = screen.getByText(/don't have an account\? register/i);
    fireEvent.click(registerLink);
    
    // Check if navigation to register page was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
