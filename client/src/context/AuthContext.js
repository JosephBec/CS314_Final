import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const login = async (userData) => {
    try {
      console.log('Starting login process...', userData);
      
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          username: userData.username,
          password: userData.password
        }
      );

      console.log('Raw login response:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const userToStore = {
        id: response.data._id,
        username: response.data.username,
        profileImage: response.data.profileImage || ''
      };

      console.log('Storing user data:', userToStore);
      
      // Update state and localStorage
      setUser(userToStore);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      return userToStore;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const updateUser = (userData) => {
    console.log('Updating user with:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Add this to check context updates
  useEffect(() => {
    console.log('Auth context user updated:', user);
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