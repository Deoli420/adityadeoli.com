# Bantr API Test Suite

A comprehensive web-based testing dashboard for the Bantr Twitter Analytics API. This application provides a simple web interface to run automated API tests and view detailed HTML reports.

## 🚀 Features

- **Web-based Test Runner**: Simple one-click test execution
- **Live Log Streaming**: Real-time test output in the browser
- **HTML Test Reports**: Detailed test results with Jest HTML Reporter
- **Docker Support**: Fully containerized for easy deployment
- **Health Monitoring**: Built-in health checks and status endpoints
- **Responsive UI**: Works on desktop and mobile devices

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for containerized deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bantr-api-test-suite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API credentials
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🐳 Docker Deployment

### Build and run with Docker

```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

### Or use Docker Compose

```yaml
version: '3.8'
services:
  bantr-test-suite:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

## 📁 Project Structure

```
/
├── config/              # Test configuration files
├── src/                 # Test source code
│   ├── tests/          # Test files (*.test.js, *.spec.js)
│   └── utils/          # Test utilities and setup
├── public/             # Web UI static files
│   └── index.html      # Main web interface
├── server.js           # Express.js web server
├── jest.config.js      # Jest configuration
├── Dockerfile          # Docker configuration
├── package.json        # Dependencies and scripts
└── .env.example        # Environment variables template
```

## 🧪 Writing Tests

Tests should be placed in the `src/tests/` directory and follow Jest conventions:

```javascript
// src/tests/example.test.js
describe('API Endpoint Tests', () => {
  test('should return user data', async () => {
    const response = await global.testUtils.apiRequest('/api/user/123');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('user');
  });
});
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# API Configuration
BANTR_API_BASE_URL=https://api.bantr.fun
BANTR_API_KEY=your_api_key_here

# Server Configuration  
PORT=3000
NODE_ENV=production

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=3
```

### Jest Configuration

The `jest.config.js` file includes:
- HTML report generation
- Coverage collection
- Custom test patterns
- Timeout settings

## 📊 API Endpoints

The web server provides these endpoints:

- `GET /` - Web UI dashboard
- `POST /run-tests` - Execute test suite (streaming response)
- `GET /report` - Serve HTML test report
- `GET /health` - Health check endpoint
- `GET /status` - Current test status

## 🎯 Usage

1. **Open the web interface** at `http://localhost:3000`
2. **Click "Run Automation Tests"** to start the test suite
3. **Watch live logs** as tests execute
4. **View the HTML report** when tests complete

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Status
```bash
curl http://localhost:3000/status
```

## 🚀 Deployment Options

### Local Development
```bash
npm start
```

### Docker Container
```bash
docker build -t bantr-test-suite .
docker run -p 3000:3000 --env-file .env bantr-test-suite
```

### Cloud Deployment
The application is ready for deployment on:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Heroku
- DigitalOcean App Platform

## 🛡️ Security

- Non-root user in Docker container
- Environment variable validation
- CORS configuration
- Process isolation
- Graceful shutdown handling

## 📈 Performance

- Streaming test output for real-time feedback
- Automatic cleanup of test processes
- Memory-efficient log handling
- Health check monitoring
- Graceful error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tests in `src/tests/`
4. Update documentation
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details