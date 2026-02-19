// Example test file for Bantr API
describe('Bantr API Test Suite', () => {
  describe('Health Check', () => {
    test('should respond to health check', async () => {
      const response = await global.testUtils.apiRequest('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    test('should handle authentication', async () => {
      const response = await global.testUtils.apiRequest('/auth/verify');
      expect(response.status).toBeOneOf([200, 401, 403]);
    });
  });

  describe('Analytics Endpoints', () => {
    test('should fetch user analytics', async () => {
      const testData = global.testUtils.generateTestData();
      const response = await global.testUtils.apiRequest(`/analytics/user/${testData.userId}`);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('analytics');
      } else {
        expect(response.status).toBeOneOf([401, 403, 404]);
      }
    });

    test('should handle tweet analysis', async () => {
      const response = await global.testUtils.apiRequest('/analytics/tweets', {
        method: 'POST',
        body: JSON.stringify({
          tweetIds: ['1234567890', '0987654321']
        })
      });
      
      expect(response.status).toBeOneOf([200, 400, 401, 403]);
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () => 
        global.testUtils.apiRequest('/health')
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid endpoints', async () => {
      const response = await global.testUtils.apiRequest('/invalid-endpoint');
      expect(response.status).toBe(404);
    });

    test('should handle malformed requests', async () => {
      const response = await global.testUtils.apiRequest('/analytics/tweets', {
        method: 'POST',
        body: 'invalid json'
      });
      
      expect(response.status).toBeOneOf([400, 422]);
    });
  });
});

// Custom Jest matchers
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});