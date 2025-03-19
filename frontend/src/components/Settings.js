import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Settings.css';

function Settings({ onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage || '/default-avatar.png');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [charCount, setCharCount] = useState(bio.length);

  // Fetch user data to get the latest bio
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user && user.id) {
          const response = await axios.get(`http://localhost:5000/api/users/${user.id}`);
          setBio(response.data.bio || '');
          setCharCount(response.data.bio ? response.data.bio.length : 0);
        }
      } catch (error) {
        console.error('Error fetching user data:', error.message);
      }
    };

    fetchUserData();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setError('Image must be less than 5MB');
        setSuccess('');
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
    setSuccess('');

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
      
      const updatedUser = {
        ...user,
        profileImage: response.data.profileImage
      };
      
      updateUser(updatedUser);
      setSuccess('Profile image updated successfully!');
      
      // Force reload of images
      const timestamp = new Date().getTime();
      setPreviewUrl(`${response.data.profileImage}?t=${timestamp}`);
    } catch (error) {
      setError('Error uploading image: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleBioChange = (e) => {
    const newBio = e.target.value;
    if (newBio.length <= 500) {
      setBio(newBio);
      setCharCount(newBio.length);
    }
  };

  const saveBio = async () => {
    setIsSavingBio(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user.id}/bio`,
        { bio },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const updatedUser = {
        ...user,
        bio: response.data.user.bio
      };
      
      updateUser(updatedUser);
      setSuccess('Bio updated successfully!');
    } catch (error) {
      setError('Error updating bio: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        // Make sure we have the correct user ID
        if (!user || !user.id) {
          throw new Error('User ID not found');
        }
        
        // Make the delete request
        const response = await axios.delete(
          `http://localhost:5000/api/auth/delete/${user.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.status === 200) {
          // First clear user data from local storage and state
          logout();
          // Then redirect to login page
          navigate('/login', { replace: true });
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
      } catch (error) {
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
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="settings-section">
        <h3>Profile Image</h3>
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
      </div>

      <div className="settings-section">
        <h3>Profile Bio</h3>
        <div className="bio-section">
          <textarea
            value={bio}
            onChange={handleBioChange}
            placeholder="Write something about yourself..."
            maxLength={500}
            className="bio-textarea"
          />
          <div className="bio-char-count">
            {charCount}/500 characters
          </div>
          <button 
            onClick={saveBio} 
            disabled={isSavingBio}
            className="save-bio-button"
          >
            {isSavingBio ? 'Saving...' : 'Save Bio'}
          </button>
        </div>
      </div>

      <div className="settings-section danger-zone">
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