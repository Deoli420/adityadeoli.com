import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store current test process
let currentTestProcess = null;
let isTestRunning = false;

// Endpoint to run tests
app.post('/run-tests', (req, res) => {
  if (isTestRunning) {
    return res.status(409).json({ error: 'Tests are already running' });
  }

  isTestRunning = true;
  
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Clean up any existing report
  const reportPath = path.join(__dirname, 'jest-html-report.html');
  if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath);
  }

  // Spawn the test process
  currentTestProcess = spawn('npm', ['test'], {
    cwd: __dirname,
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  // Send initial message
  res.write('Starting Bantr API test suite...\n\n');

  // Handle stdout
  currentTestProcess.stdout.on('data', (data) => {
    const output = data.toString();
    res.write(output);
  });

  // Handle stderr
  currentTestProcess.stderr.on('data', (data) => {
    const output = data.toString();
    res.write(`ERROR: ${output}`);
  });

  // Handle process completion
  currentTestProcess.on('close', (code) => {
    isTestRunning = false;
    currentTestProcess = null;
    
    res.write(`\n\nTest suite completed with exit code: ${code}\n`);
    
    // Check if HTML report was generated
    if (fs.existsSync(reportPath)) {
      res.write('HTML report generated successfully!\n');
    } else {
      res.write('Warning: HTML report not found. Check test configuration.\n');
    }
    
    res.end();
  });

  // Handle process error
  currentTestProcess.on('error', (error) => {
    isTestRunning = false;
    currentTestProcess = null;
    res.write(`\nProcess error: ${error.message}\n`);
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    if (currentTestProcess && !currentTestProcess.killed) {
      currentTestProcess.kill('SIGTERM');
      isTestRunning = false;
      currentTestProcess = null;
    }
  });
});

// Endpoint to serve the HTML report
app.get('/report', (req, res) => {
  const reportPath = path.join(__dirname, 'jest-html-report.html');
  
  if (fs.existsSync(reportPath)) {
    res.sendFile(reportPath);
  } else {
    res.status(404).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Report Not Found</h2>
          <p>The test report hasn't been generated yet. Please run the tests first.</p>
          <button onclick="window.parent.location.reload()">Go Back</button>
        </body>
      </html>
    `);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    testRunning: isTestRunning,
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({ 
    isRunning: isTestRunning,
    hasReport: fs.existsSync(path.join(__dirname, 'jest-html-report.html'))
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (currentTestProcess && !currentTestProcess.killed) {
    currentTestProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (currentTestProcess && !currentTestProcess.killed) {
    currentTestProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// SentinelAI project showcase (static HTML page)
app.get('/projects/sentinelai', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects', 'sentinelai.html'));
});

// SPA catch-all — serve index.html for any unmatched routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Bantr API Test Suite Server running on port ${PORT}`);
  console.log(`📊 Web UI available at: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});