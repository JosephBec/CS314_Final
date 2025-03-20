# Features Added For Extra Credit
- I did the whole thing full stack
- sending images
- live typing indicators (work for both DMs and group chats)
- read receipts
- notification sounds
- browser tab unread message count

# MERN Stack Chat Application

A full-stack real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

The project is organized into two main directories:

### Backend
- Located in the `/backend` directory
- Node.js/Express server
- MongoDB database connection
- API routes for authentication, messages, friends, users, and group chats
- File upload functionality

### Frontend
- Located in the `/frontend` directory
- React-based user interface
- Responsive design for desktop and mobile
- Real-time messaging capabilities

## Getting Started

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or cloud)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
   This will install dependencies for the root project, backend, and frontend.

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```

4. Start the development server:
   ```
   npm run dev
   ```
   This will start both the backend server and frontend client concurrently.

## Features
- User authentication
- Real-time direct messaging
- Group chat functionality
- Friend management
- Profile customization
- Message notifications
- File sharing

## Testing

The application uses a comprehensive testing approach with both unit tests and end-to-end tests.

### Jest Tests (Unit/Component Testing)

The frontend components and utilities are tested using Jest and React Testing Library. These tests focus on ensuring individual components and functions work correctly in isolation.

To run the Jest tests:

```bash
cd frontend
npm run test:jest
```

Key test files:
- `src/utils/formatters.test.js` - Tests for date formatting and text truncation utilities
- `src/App.test.js` - Tests for the main App component and routing
- `src/components/LandingPage.test.js` - Tests for the LandingPage component
- `src/context/AuthContext.test.js` - Tests for the authentication context
- `src/context/SocketContext.test.js` - Tests for the socket connection context

#### Jest Testing Best Practices

1. **Mock External Dependencies**: When testing components that rely on external services (like axios for API calls or socket.io for real-time communication), use Jest's mocking capabilities to isolate the component behavior.

2. **Test Component Rendering**: Ensure components render correctly with different props and state conditions.

3. **Test User Interactions**: Use React Testing Library's `fireEvent` or `userEvent` to simulate user interactions like clicks and form submissions.

4. **Use `waitFor` for Async Operations**: When testing components with asynchronous operations, use `waitFor` to wait for expected changes.

5. **Avoid Implementation Details**: Focus tests on behavior visible to users rather than implementation details.

### Cypress Tests (End-to-End Testing)

Cypress is used for end-to-end testing to ensure the application works correctly from a user's perspective.

To run the Cypress tests:

```bash
cd frontend
npm run test:cypress
```

Key test files:
- `cypress/e2e/direct-messaging.cy.js` - Tests for the direct messaging functionality

#### Cypress Testing Best Practices

1. **Test Real User Flows**: Create tests that simulate actual user journeys through the application.

2. **Use Data Attributes**: Add `data-testid` attributes to elements for more reliable test selectors.

3. **Isolate Tests**: Each test should be independent and not rely on the state from previous tests.

4. **Mock Network Requests**: Use Cypress's network request mocking capabilities for consistent test results.

5. **Visual Testing**: Utilize Cypress's screenshot capabilities to verify UI appearance.

### Testing Philosophy

Our testing approach follows these principles:

1. **Test Real Behavior**: Tests should verify that components behave as expected in real-world scenarios.
2. **Minimize Mocking**: We minimize mocking to ensure tests reflect actual application behavior.
3. **Component Isolation**: Unit tests focus on isolated component behavior.
4. **End-to-End Validation**: Cypress tests validate the entire application flow.

### Common Testing Issues and Solutions

1. **React Act Warnings**: When testing components with state updates, wrap state changes in `React.act()` or use React Testing Library's utilities that handle this automatically.

2. **Asynchronous Operations**: Use `async/await` with `waitFor` to properly test components with asynchronous operations.

3. **Context Providers**: When testing components that use context, ensure the test component is wrapped in the necessary providers.

4. **Router Testing**: When testing components that use React Router, mock the router or use `MemoryRouter` with specific initial entries.

5. **localStorage Mocking**: Mock localStorage for consistent test behavior across environments.

### Testing Coverage

To view the test coverage report:

```bash
cd frontend
npm run test:coverage
```

This will generate a coverage report showing which parts of the codebase are covered by tests and which need additional testing.

## Deployment

### Backend
- Located in the `/backend` directory
- Node.js/Express server
- MongoDB database connection
- API routes for authentication, messages, friends, users, and group chats
- File upload functionality

## Author
Joseph Bec
