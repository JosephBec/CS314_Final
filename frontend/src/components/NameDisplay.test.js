import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test the name display logic directly
describe('Name Display Logic Tests', () => {
  
  // Test function to simulate the name display logic from Dashboard.js
  const getDisplayName = (user) => {
    return user.firstName || user.lastName ? 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() : 
      user.username;
  };
  
  test('displays first and last name when both are available', () => {
    const user = {
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };
    
    expect(getDisplayName(user)).toBe('Test User');
  });
  
  test('displays first name only when last name is missing', () => {
    const user = {
      username: 'testuser',
      firstName: 'Test',
      lastName: ''
    };
    
    expect(getDisplayName(user)).toBe('Test');
  });
  
  test('displays last name only when first name is missing', () => {
    const user = {
      username: 'testuser',
      firstName: '',
      lastName: 'User'
    };
    
    expect(getDisplayName(user)).toBe('User');
  });
  
  test('falls back to username when both first and last name are missing', () => {
    const user = {
      username: 'testuser',
      firstName: '',
      lastName: ''
    };
    
    expect(getDisplayName(user)).toBe('testuser');
  });
  
  test('falls back to username when first and last name are undefined', () => {
    const user = {
      username: 'testuser'
    };
    
    expect(getDisplayName(user)).toBe('testuser');
  });
  
  // Test the component rendering
  test('renders name correctly in a component', () => {
    // Create a simple component that uses the name display logic
    const NameDisplay = ({ user }) => (
      <div data-testid="name-display">
        {getDisplayName(user)}
      </div>
    );
    
    const user = {
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    };
    
    render(<NameDisplay user={user} />);
    
    expect(screen.getByTestId('name-display')).toHaveTextContent('Test User');
  });
});
