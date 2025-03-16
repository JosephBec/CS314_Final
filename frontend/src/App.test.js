import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the context providers
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({ user: null })
}));

jest.mock('./context/SocketContext', () => ({
  SocketProvider: ({ children }) => <div data-testid="socket-provider">{children}</div>
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: () => <div data-testid="route" />,
  Link: ({ children }) => <a>{children}</a>
}));

// Mock the components
jest.mock('./components/LandingPage', () => () => <div data-testid="landing-page">Landing Page</div>);
jest.mock('./components/auth/Login', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('./components/auth/Register', () => () => <div data-testid="register-page">Register Page</div>);
jest.mock('./components/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard Page</div>);

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    
    // Check if the main providers are rendered
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('socket-provider')).toBeInTheDocument();
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });
});
