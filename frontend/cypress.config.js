const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Import plugins
      require('./cypress/plugins/index.js')(on, config);
      return config;
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    screenshotOnRunFailure: true,
    video: true,
    videoCompression: 32,
    trashAssetsBeforeRuns: true,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
      charts: true
    }
  },
  env: {
    apiUrl: 'http://localhost:5001'
  },
  retries: {
    runMode: 2,
    openMode: 0
  }
});
