import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (userData) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          username: userData.username,
          password: userData.password
        }
      );
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const userToStore = {
        id: response.data._id,
        username: response.data.username,
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        profileImage: response.data.profileImage || '',
        bio: response.data.bio || ''
      };
      
      // Update state and localStorage
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      return userToStore;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData) => {
    console.log('AuthContext updateUser called with:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Add this to check context updates
  useEffect(() => {
    // Removed console.log statement
  }, [user]);

  const value = {
    user,
    setUser,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 