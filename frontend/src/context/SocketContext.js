import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (user && user.id) {
      // Initialize socket connection with user ID in query params
      const newSocket = io('http://localhost:5000', {
        query: { userId: user.id }
      });
      setSocket(newSocket);

      // Set up event listeners
      newSocket.on('connect', () => {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Socket connected');
        }
        setIsConnected(true);
        
        // Register user if logged in
        newSocket.emit('register', user.id);
      });

      newSocket.on('disconnect', () => {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Socket disconnected');
        }
        setIsConnected(false);
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
    
    return () => {}; // Return empty cleanup function if no user
  }, [user]);

  // Register user ID when user logs in
  useEffect(() => {
    if (socket && user && user.id && isConnected) {
      socket.emit('register', user.id);
    }
  }, [socket, user, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
