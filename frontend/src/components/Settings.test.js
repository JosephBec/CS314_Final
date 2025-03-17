import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Settings from './Settings';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Mock dependencies
jest.mock('../context/AuthContext');
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
window.URL.createObjectURL = jest.fn(() => 'mock-image-url');
window.URL.revokeObjectURL = jest.fn();

describe('Settings Component', () => {
  const mockUser = {
    id: 'user123',
    username: 'testuser',
    profileImage: 'profile.jpg',
    bio: 'Test bio'
  };
  
  const mockUpdateUser = jest.fn();
  const mockLogout = jest.fn();
  const mockOnClose = jest.fn();
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup auth context mock
    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      logout: mockLogout
    });
    
    // Setup axios mocks
    axios.get.mockResolvedValue({
      data: {
        id: 'user123',
        username: 'testuser',
        profileImage: 'profile.jpg',
        bio: 'Test bio from server'
      }
    });
    
    axios.post.mockResolvedValue({
      data: {
        message: 'Profile updated successfully',
        profileImage: 'updated-profile.jpg'
      }
    });
    
    axios.put.mockResolvedValue({
      data: {
        message: 'Bio updated successfully',
        user: {
          id: 'user123',
          username: 'testuser',
          profileImage: 'profile.jpg',
          bio: 'Updated bio'
        }
      }
    });

    axios.delete.mockResolvedValue({
      status: 200,
      data: {
        message: 'Account deleted successfully'
      }
    });
  });
  
  test('renders settings component with user information', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Check if user information is displayed
    expect(screen.getByText('Profile Image')).toBeInTheDocument();
    expect(screen.getByText('Profile Bio')).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'profile.jpg');
  });
  
  test('handles profile image upload', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Create a mock file
    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    
    // Get the file input and simulate file upload
    const fileInput = screen.getByLabelText('Choose Image');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Check if the preview is updated
    await waitFor(() => {
      expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'mock-image-url');
    });
    
    // Check if URL.createObjectURL was called with the file
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(file);
    
    // Check if upload button appears
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });
  
  test('handles bio update', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Update bio field
    const bioTextarea = screen.getByPlaceholderText('Write something about yourself...');
    
    await act(async () => {
      fireEvent.change(bioTextarea, {
        target: { value: 'Updated bio' }
      });
    });
    
    // Click save bio button
    await act(async () => {
      fireEvent.click(screen.getByText('Save Bio'));
    });
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/users/user123/bio',
        { bio: 'Updated bio' },
        expect.any(Object)
      );
    });
    
    // Check if updateUser was called with the updated user data
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });
    
    // Check if success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Bio updated successfully!')).toBeInTheDocument();
    });
  });
  
  test('handles close button', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Click close button
    await act(async () => {
      fireEvent.click(screen.getByText('×'));
    });
    
    // Check if onClose function was called
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('displays error message when image is too large', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Create a mock file that's too large (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-image.png', { type: 'image/png' });
    
    // Get the file input and simulate file upload
    const fileInput = screen.getByLabelText('Choose Image');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });
    
    // Check if error message is displayed
    expect(screen.getByText('Image must be less than 5MB')).toBeInTheDocument();
  });
  
  test('handles delete account button click', async () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    
    // Mock the navigate function from react-router-dom
    require('react-router-dom').useNavigate = jest.fn(() => mockNavigate);
    
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    // Click delete account button
    await act(async () => {
      fireEvent.click(screen.getByText('Delete Account'));
    });
    
    // Check if confirm was called
    expect(window.confirm).toHaveBeenCalled();
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/delete/user123',
        expect.any(Object)
      );
    });
    
    // Check if logout was called
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
    
    // Check if navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });
});
