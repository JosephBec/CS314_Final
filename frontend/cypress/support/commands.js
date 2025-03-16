// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to register a user
Cypress.Commands.add('registerUser', (username, email, password) => {
  cy.log(`Registering user: ${username}`);
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/register`,
    body: {
      username,
      email,
      password
    },
    failOnStatusCode: false
  }).then(response => {
    // Log the response for debugging
    cy.log(`Registration response status: ${response.status}`);
    if (response.status !== 201 && response.status !== 200 && response.status !== 409) {
      cy.log(`Registration failed with status: ${response.status}`);
      cy.log(`Response body: ${JSON.stringify(response.body)}`);
    }
  });
});

// Custom command to login a user
Cypress.Commands.add('login', (username, password) => {
  cy.log(`Logging in as: ${username}`);
  cy.visit('/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  
  // Take a screenshot after login attempt
  cy.screenshot(`login-${username}`);
  
  // Verify successful login
  cy.url().should('include', '/chat', { timeout: 10000 });
});

// Custom command to create a group
Cypress.Commands.add('createGroup', (groupName, members) => {
  cy.log(`Creating group: ${groupName} with members: ${members.join(', ')}`);
  cy.contains('Create Group').click();
  cy.get('input[name="groupName"]').type(groupName);
  
  members.forEach(member => {
    cy.get('input[name="memberSearch"]').clear().type(member);
    cy.contains(member).click();
    // Verify member was added to the group
    cy.get('.selected-members').should('contain', member);
  });
  
  // Take a screenshot before creating the group
  cy.screenshot(`create-group-${groupName}`);
  
  cy.get('button').contains('Create Group').click();
  
  // Verify success message with retry
  cy.contains(`Group "${groupName}" created successfully`, { timeout: 10000 }).should('be.visible');
  
  // Take a screenshot after group creation
  cy.screenshot(`group-created-${groupName}`);
});

// Custom command to send a message
Cypress.Commands.add('sendMessage', (recipient, message) => {
  cy.log(`Sending message to ${recipient}: ${message}`);
  
  // Select the recipient
  if (recipient.startsWith('group:')) {
    const groupName = recipient.replace('group:', '');
    cy.get('.group-list').contains(groupName).click();
    cy.log(`Selected group: ${groupName}`);
  } else {
    cy.get('.user-list').contains(recipient).click();
    cy.log(`Selected user: ${recipient}`);
  }
  
  // Take a screenshot before sending the message
  cy.screenshot(`before-send-message-to-${recipient.replace(':', '-')}`);
  
  // Type and send the message
  cy.get('input[name="messageInput"]').type(message);
  cy.get('button[type="submit"]').click();
  
  // Verify message appears with retry
  cy.contains(message, { timeout: 10000 }).should('be.visible');
  
  // Take a screenshot after sending the message
  cy.screenshot(`after-send-message-to-${recipient.replace(':', '-')}`);
});

// Custom command to check for received messages
Cypress.Commands.add('checkReceivedMessage', (sender, message) => {
  cy.log(`Checking for message from ${sender}: ${message}`);
  
  // Select the sender
  if (sender.startsWith('group:')) {
    const groupName = sender.replace('group:', '');
    cy.get('.group-list').contains(groupName).click();
    cy.log(`Selected group: ${groupName}`);
  } else {
    cy.get('.user-list').contains(sender).click();
    cy.log(`Selected user: ${sender}`);
  }
  
  // Take a screenshot before checking for the message
  cy.screenshot(`before-check-message-from-${sender.replace(':', '-')}`);
  
  // Verify message is visible with retry
  cy.contains(message, { timeout: 15000 }).should('be.visible');
  
  // Take a screenshot after finding the message
  cy.screenshot(`found-message-from-${sender.replace(':', '-')}`);
});

// Custom command to check notification count
Cypress.Commands.add('checkNotificationCount', (expectedCount) => {
  cy.log(`Checking for notification count: ${expectedCount}`);
  cy.get('.notification-badge').should('contain', expectedCount);
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.log('Logging out');
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
  cy.screenshot('after-logout');
});

// Custom command to check if an element is visible in viewport
Cypress.Commands.add('isVisibleInViewport', { prevSubject: true }, (subject) => {
  const bottom = Cypress.$(cy.state('window')).height();
  const rect = subject[0].getBoundingClientRect();
  
  expect(rect.top).to.be.lessThan(bottom);
  expect(rect.bottom).to.be.greaterThan(0);
  expect(rect.left).to.be.lessThan(Cypress.$(cy.state('window')).width());
  expect(rect.right).to.be.greaterThan(0);
  
  return subject;
});
