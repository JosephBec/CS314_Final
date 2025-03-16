// Mock implementation of AuthContext
import React from 'react';

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  return <AuthContext.Provider value={{
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  }}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = () => {
  return {
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  };
};

export default AuthContext;
