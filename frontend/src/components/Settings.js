import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Settings({ onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage || '/default-avatar.png');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setError('Image must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!profileImage) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('profileImage', profileImage);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/${user.id}/profile-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('Upload response:', response.data);
      
      const updatedUser = {
        ...user,
        profileImage: response.data.user.profileImage
      };
      
      updateUser(updatedUser);
      setError('Profile image updated successfully!');
      
      // Force reload of images
      const timestamp = new Date().getTime();
      setPreviewUrl(`${response.data.user.profileImage}?t=${timestamp}`);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error uploading image: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    console.log('Delete account initiated for user:', user); // Debug log
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirmed) {
      console.log('Delete confirmed, sending request...'); // Debug log
      try {
        // Make sure we have the correct user ID
        if (!user || !user._id) {
          console.error('User object:', user); // Debug log
          throw new Error('User ID not found');
        }

        console.log('Attempting to delete account with ID:', user._id); // Debug log
        
        // Make the delete request
        const response = await axios.delete(
          `http://localhost:5000/api/auth/delete/${user._id}`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        console.log('Delete response:', response); // Debug log

        if (response.status === 200) {
          // Success - log out and redirect
          logout();
          navigate('/login');
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
      } catch (error) {
        console.error('Full error object:', error);
        console.error('Error response:', error.response);
        setError(
          'Failed to delete account: ' + 
          (error.response?.data?.error || error.message || 'Unknown error occurred')
        );
      }
    }
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      {error && <div className="error">{error}</div>}
      
      <div className="profile-image-section">
        <div className="profile-image-container">
          <img 
            src={previewUrl} 
            alt="Profile" 
            className="profile-image-preview"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="file-input"
          id="profile-image-input"
        />
        <label htmlFor="profile-image-input" className="file-input-label">
          Choose Image
        </label>
        {profileImage && (
          <button 
            onClick={uploadImage} 
            disabled={isUploading}
            className="upload-button"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </button>
        )}
      </div>

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button 
          className="delete-account-button"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </button>
      </div>

      <button className="close-button" onClick={onClose}>×</button>
    </div>
  );
}

export default Settings; 