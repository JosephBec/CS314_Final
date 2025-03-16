// Mock implementation of SocketContext
import React from 'react';

const SocketContext = React.createContext();

export const SocketProvider = ({ children }) => {
  return <SocketContext.Provider value={{
    socket: null,
    isConnected: false,
    messages: [],
    sendMessage: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn()
  }}>
    {children}
  </SocketContext.Provider>;
};

export const useSocket = () => {
  return {
    socket: null,
    isConnected: false,
    messages: [],
    sendMessage: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn()
  };
};

export default SocketContext;
