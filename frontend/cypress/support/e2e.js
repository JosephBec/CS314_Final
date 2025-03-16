// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent Cypress from failing tests when application throws uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Add better error messages for assertions
Cypress.on('fail', (error, runnable) => {
  // If the error is related to an element not being found, provide a more helpful message
  if (error.message.includes('Expected to find element')) {
    error.message = `${error.message}\n\nThis could mean the UI element is not rendered, has a different selector, or the application state is not as expected.`;
  }
  throw error;
});
