import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
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
        profileImage: 'updated-profile.jpg'
      }
    });
    
    axios.put.mockResolvedValue({
      data: {
        user: {
          bio: 'Updated bio'
        }
      }
    });

    axios.delete.mockResolvedValue({ status: 200 });
  });
  
  test('renders settings component with user information', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for user data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(`http://localhost:5000/api/users/${mockUser.id}`);
    });
    
    // Check if user info is displayed
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/profile image/i)).toBeInTheDocument();
    expect(screen.getByText(/profile bio/i)).toBeInTheDocument();
  });
  
  test('handles image upload', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    // Get the file input and simulate file selection
    const fileInput = screen.getByLabelText(/choose image/i);
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Check if preview URL is set
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    
    // Click upload button
    const uploadButton = screen.getByText(/upload image/i);
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    // Check if axios.post was called to upload the image
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:5000/api/users/${mockUser.id}/profile-image`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });
    
    // Check if updateUser was called
    expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      profileImage: 'updated-profile.jpg'
    }));
  });
  
  test('handles bio update', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Wait for user data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
    
    // Find bio textarea and update it
    const bioTextarea = screen.getByPlaceholderText(/write something about yourself/i);
    await act(async () => {
      fireEvent.change(bioTextarea, { target: { value: 'Updated bio' } });
    });
    
    // Click save bio button
    const saveBioButton = screen.getByText(/save bio/i);
    await act(async () => {
      fireEvent.click(saveBioButton);
    });
    
    // Check if axios.put was called to update the bio
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:5000/api/users/${mockUser.id}/bio`,
        { bio: 'Updated bio' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    // Check if updateUser was called
    expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      bio: 'Updated bio'
    }));
  });
  
  test('handles close button click', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Find and click close button
    const closeButton = screen.getByText('×');
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  test('displays error message when image is too large', async () => {
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Create a mock file that's too large (> 5MB)
    const largeFile = new File(['x'.repeat(6000000)], 'large.png', { type: 'image/png' });
    
    // Get the file input and simulate file selection
    const fileInput = screen.getByLabelText(/choose image/i);
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });
    
    // Check if error message is displayed
    expect(screen.getByText(/image must be less than 5mb/i)).toBeInTheDocument();
  });
  
  test('handles delete account confirmation', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);
    
    await act(async () => {
      render(<Settings onClose={mockOnClose} />);
    });
    
    // Find and click delete account button
    const deleteButton = screen.getByText(/delete account/i);
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    // Check if confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    // Check if axios.delete was called
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        `http://localhost:5000/api/auth/delete/${mockUser.id}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    // Check if logout was called
    expect(mockLogout).toHaveBeenCalled();
  });
});
