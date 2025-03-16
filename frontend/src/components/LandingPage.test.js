import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

// Mock react-router-dom Link component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }) => <a href={to} data-testid={`link-${to}`}>{children}</a>
}));

describe('LandingPage Component', () => {
  beforeEach(() => {
    // Setup component with router for each test
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  });

  test('renders header and title', () => {
    // Check if the main heading is rendered
    const heading = screen.getByText('DirectMessage');
    expect(heading).toBeInTheDocument();
    
    // Check if the tagline is rendered
    expect(screen.getByText('Connect with friends and colleagues instantly')).toBeInTheDocument();
  });
  
  test('renders feature section with cards', () => {
    // Check if feature section heading is rendered
    expect(screen.getByText('Features')).toBeInTheDocument();
    
    // Check if feature cards are rendered
    expect(screen.getByText('Real-time Messaging')).toBeInTheDocument();
    expect(screen.getByText('Group Chats')).toBeInTheDocument();
    expect(screen.getByText('Secure Communication')).toBeInTheDocument();
    expect(screen.getByText('File Sharing')).toBeInTheDocument();
    expect(screen.getByText('Cross-Platform')).toBeInTheDocument();
    expect(screen.getByText('User Profiles')).toBeInTheDocument();
  });
  
  test('renders call-to-action section with login and sign up links', () => {
    // Check if CTA section is rendered
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();
    
    // Check if login and sign up links are rendered
    const loginLink = screen.getByText('Login');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    
    const signUpLink = screen.getByText('Sign Up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
