const { merge } = require('mochawesome-merge');
const generator = require('mochawesome-report-generator');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Options for the report generator
const options = {
  files: ['./cypress/reports/*.json'],
  reportDir: './cypress/reports/combined',
  inline: true,
  saveJson: true,
  charts: true
};

// Generate the combined report
merge(options).then(report => {
  return generator.create(report, options);
}).then(result => {
  console.log('Combined report generated at:', result[0]);
}).catch(error => {
  console.error('Error generating report:', error);
});
