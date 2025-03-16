# Cypress Feature Tests for Direct Message App

This directory contains Cypress end-to-end tests that validate the core features of the Direct Message App.

## Test Features

The tests are organized into three main feature categories:

### 1. User Authentication (authentication.cy.js)
- **Successful User Registration**: Tests that a new user can register with valid credentials
- **Failed Login Attempt**: Verifies that the system properly handles login attempts with incorrect passwords

### 2. Direct Messaging (direct-messaging.cy.js)
- **Sending and Receiving Messages**: Tests that messages can be sent between users and are properly delivered with correct status indicators

### 3. Group Messaging (group-messaging.cy.js)
- **Creating a Group and Sending Group Messages**: Tests the creation of a group, adding members, and sending messages to all group members

## Enhanced Testing Features

Our Cypress tests include several advanced features to improve reliability and reporting:

### Visual Testing
- **Automatic Screenshots**: The tests take screenshots at critical points (login, message sending, etc.)
- **Failure Captures**: Screenshots are automatically taken when tests fail to help with debugging

### Test Reporting
- **Mochawesome Reports**: Tests generate detailed HTML reports with charts and statistics
- **Combined Reports**: All test results are combined into a single, easy-to-read report

### Test Reliability
- **Automatic Retries**: Tests automatically retry on failure to handle flaky tests
- **Extended Timeouts**: Longer timeouts for network operations to handle slower connections
- **Viewport Consistency**: Tests run with a consistent viewport size to ensure UI elements are visible

## Running the Tests

### Automated Test Setup

The easiest way to run all tests is using our automated setup script:

```bash
npm run test:setup
```

This script will:
1. Start the backend server
2. Start the frontend server
3. Run all Cypress tests
4. Generate a combined test report
5. Clean up all processes when done

### Manual Test Setup

If you prefer to run tests manually, make sure both the frontend and backend servers are running:

```bash
# Start the backend server
cd ../backend
npm start

# In a separate terminal, start the frontend server
cd ../frontend
npm start
```

### Running All Tests

```bash
npm run test:all
```

### Running Specific Feature Tests

```bash
# Run only authentication tests
npm run test:auth

# Run only direct messaging tests
npm run test:messaging

# Run only group messaging tests
npm run test:group
```

### Generating Test Reports

After running tests, you can generate a combined HTML report:

```bash
npm run report:generate
```

The report will be available in `cypress/reports/combined/mochawesome.html`

## Test Structure

Each test file follows a similar structure:

1. **Fixtures**: Test data is loaded from JSON fixtures in the `fixtures` directory
2. **Selectors**: UI element selectors are stored in the `fixtures/selectors.json` file
3. **Setup**: Creates test users and necessary data
4. **Test Cases**: Implements specific test scenarios
5. **Assertions**: Verifies that the application behaves as expected

## Custom Commands

The tests use several custom Cypress commands (defined in `cypress/support/commands.js`):

- `cy.registerUser()`: Registers a new user
- `cy.login()`: Logs in a user
- `cy.createGroup()`: Creates a new group with specified members
- `cy.sendMessage()`: Sends a message to a user or group
- `cy.checkReceivedMessage()`: Checks if a message was received
- `cy.checkNotificationCount()`: Checks the notification badge count
- `cy.logout()`: Logs out the current user
- `cy.isVisibleInViewport()`: Checks if an element is visible in the current viewport

## Debugging Tests

When tests fail, you can:

1. Check the screenshots in `cypress/screenshots`
2. Review the videos in `cypress/videos`
3. Look at the detailed test reports in `cypress/reports`

## Continuous Integration

These tests are designed to run in CI environments. The key configurations are:

- **Retries**: Tests will retry up to 2 times in run mode
- **Videos**: Test runs are recorded as videos
- **Reports**: JSON reports are generated for CI integration
