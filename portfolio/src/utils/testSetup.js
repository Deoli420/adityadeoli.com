// Test setup and configuration
require('dotenv').config();

// Global test timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting Bantr API Test Suite');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'test'}`);
  console.log(`🔗 API Base URL: ${process.env.BANTR_API_BASE_URL || 'Not configured'}`);
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Test suite completed');
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep error logging
  };
}

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateTestData: () => ({
    timestamp: Date.now(),
    testId: Math.random().toString(36).substr(2, 9),
    userId: process.env.TEST_USER_ID || 'test_user_123'
  }),
  
  apiRequest: async (endpoint, options = {}) => {
    const baseUrl = process.env.BANTR_API_BASE_URL || 'https://api.bantr.fun';
    const apiKey = process.env.BANTR_API_KEY;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        ...options.headers
      }
    };
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...defaultOptions,
      ...options
    });
    
    return response;
  }
};