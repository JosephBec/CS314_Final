const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  backendPort: 5001,
  frontendPort: 3000,
  backendDir: path.join(__dirname, '../../../backend'),
  frontendDir: path.join(__dirname, '../../'),
  waitTime: 10000 // Time to wait for servers to start (ms)
};

// Store process references to kill them later
let backendProcess = null;
let frontendProcess = null;

// Function to start the backend server
function startBackend() {
  console.log('Starting backend server...');
  
  // Check if backend directory exists
  if (!fs.existsSync(config.backendDir)) {
    console.error(`Backend directory not found: ${config.backendDir}`);
    process.exit(1);
  }
  
  // Start the backend server
  backendProcess = spawn('npm', ['start'], {
    cwd: config.backendDir,
    stdio: 'pipe',
    shell: true
  });
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data.toString().trim()}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data.toString().trim()}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
  
  // Wait for backend to start
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Backend server should be running on port ${config.backendPort}`);
      resolve();
    }, config.waitTime);
  });
}

// Function to start the frontend server
function startFrontend() {
  console.log('Starting frontend server...');
  
  // Check if frontend directory exists
  if (!fs.existsSync(config.frontendDir)) {
    console.error(`Frontend directory not found: ${config.frontendDir}`);
    process.exit(1);
  }
  
  // Start the frontend server
  frontendProcess = spawn('npm', ['start'], {
    cwd: config.frontendDir,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, BROWSER: 'none' } // Prevent browser from opening
  });
  
  frontendProcess.stdout.on('data', (data) => {
    console.log(`Frontend: ${data.toString().trim()}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    console.error(`Frontend Error: ${data.toString().trim()}`);
  });
  
  frontendProcess.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });
  
  // Wait for frontend to start
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Frontend server should be running on port ${config.frontendPort}`);
      resolve();
    }, config.waitTime);
  });
}

// Function to run Cypress tests
function runCypressTests() {
  console.log('Running Cypress tests...');
  
  const cypressProcess = spawn('npm', ['run', 'test:all'], {
    cwd: config.frontendDir,
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    cypressProcess.on('close', (code) => {
      console.log(`Cypress tests completed with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cypress tests failed with code ${code}`));
      }
    });
  });
}

// Function to generate test report
function generateReport() {
  console.log('Generating test report...');
  
  const reportProcess = spawn('npm', ['run', 'report:generate'], {
    cwd: config.frontendDir,
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve) => {
    reportProcess.on('close', (code) => {
      console.log(`Report generation completed with code ${code}`);
      resolve();
    });
  });
}

// Function to clean up processes
function cleanup() {
  console.log('Cleaning up processes...');
  
  if (backendProcess) {
    backendProcess.kill();
    console.log('Backend server stopped');
  }
  
  if (frontendProcess) {
    frontendProcess.kill();
    console.log('Frontend server stopped');
  }
}

// Main function to orchestrate the test process
async function main() {
  try {
    // Register cleanup handler for graceful shutdown
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Cleaning up...');
      cleanup();
      process.exit(0);
    });
    
    // Start servers
    await startBackend();
    await startFrontend();
    
    // Run tests
    await runCypressTests();
    
    // Generate report
    await generateReport();
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error during test execution:', error.message);
  } finally {
    // Clean up
    cleanup();
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  startBackend,
  startFrontend,
  runCypressTests,
  generateReport,
  cleanup
};
