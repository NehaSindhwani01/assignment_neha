# Media Platform Backend

A secure media streaming platform backend built with Node.js, Express, and MongoDB. This API provides user authentication, media asset management, secure streaming capabilities with token-based access control, and comprehensive analytics with Redis caching.

## 🚀 Features

- **User Authentication System**
  - Email-based registration with OTP verification
  - Secure login with JWT tokens
  - Password reset functionality with OTP
  - Email verification using Nodemailer

- **Media Asset Management**
  - Upload and store media metadata (video/audio)
  - CRUD operations for media assets
  - User-specific media collections

- **Secure Streaming**
  - Token-based streaming URLs with expiration
  - IP-based access control
  - View logging and analytics
  - Short-lived streaming tokens (10 minutes)

- **Analytics & Tracking**
  - Real-time view logging with IP and timestamp
  - Comprehensive analytics dashboard with Redis caching
  - View statistics and trends
  - Geographic distribution tracking
  - User agent analysis
  - Rate limiting for view logging

- **Performance Optimization**
  - Redis caching for analytics data (1-hour cache expiration)
  - Optimized database queries
  - Non-blocking cache operations

- **Security Features**
  - JWT token authentication
  - Password hashing with bcrypt
  - Rate limiting protection
  - CORS enabled
  - Helmet security headers

- **DevOps & Testing**
  - Docker containerization
  - Docker Compose setup with Redis
  - Comprehensive Jest test suite
  - Health check endpoints

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v20 or higher)
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)
- Gmail account for email services (or other SMTP provider)
- Docker (optional, for containerized deployment)

## 🛠️ Installation

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd media-platform-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/media-platform

# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
STREAMING_SECRET=your-streaming-secret-key

# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
```

4. **Start Redis server** (if running locally)
```bash
redis-server
```

5. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Docker Setup

1. **Using Docker Compose (Recommended)**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Manual Docker Build**
```bash
# Build the image
docker build -t media-platform-backend .

# Run with Redis (assuming Redis is running separately)
docker run -p 5000:5000 --env-file .env media-platform-backend
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
media-platform-backend/
├── config/
│   ├── database.js          # MongoDB connection setup
│   ├── jwt.js              # JWT configuration utilities
│   └── redis.js            # Redis connection and client setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── mediaController.js   # Media management logic
│   └── analyticsController.js # Analytics tracking with caching
├── middleware/
│   ├── auth.js             # JWT verification middleware
│   ├── errorhandler.js     # Error handling middleware
│   └── rateLimiter.js      # Rate limiting middleware
├── models/
│   ├── AdminUser.js        # User model with authentication
│   ├── MediaAsset.js       # Media asset model
│   └── MediaViewLog.js     # View tracking model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── media.js            # Media management routes
│   └── analytics.js        # Analytics routes with rate limiting
├── tests/
│   ├── setup.js            # Test environment setup
│   ├── auth.test.js        # Authentication tests
│   └── analytics.test.js   # Analytics tests
├── utils/
│   └── emailService.js     # Email sending utilities
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker container configuration
├── package.json            # Project dependencies
└── server.js              # Main application entry point
```

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Sign Up
```http
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email. Verify to complete registration.",
  "data": {
    "email": "user@example.com"
  }
}
```

#### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully.",
  "data": {
    "user": {
      "id": "userId",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

#### 3. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### 4. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 5. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

#### 6. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Media Routes (`/api/media`)

All media routes require authentication via `Authorization: Bearer <jwt-token>` header.

#### 1. Add Media Asset
```http
POST /api/media
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My Video",
  "type": "video",
  "file_url": "https://example.com/video.mp4"
}
```

#### 2. Get All Media Assets
```http
GET /api/media?page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### 3. Generate Streaming URL
```http
GET /api/media/:id/stream-url
Authorization: Bearer <jwt-token>
```
**Response:**
```json
{
  "success": true,
  "message": "Stream URL generated successfully.",
  "data": {
    "stream_url": "http://localhost:5000/api/media/:id/stream?token=streaming-token",
    "expires_in": "10 minutes"
  }
}
```

#### 4. Stream Media (Public with token)
```http
GET /api/media/:id/stream?token=<streaming-token>
```

### Analytics Routes (`/api/analytics`)

All analytics routes require authentication via `Authorization: Bearer <jwt-token>` header.

#### 1. Log Media View (Rate Limited)
```http
POST /api/analytics/media/:id/view
```
**Response:**
```json
{
  "success": true,
  "message": "View logged successfully.",
  "data": {
    "view_id": "viewId",
    "media_id": "mediaId",
    "viewed_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. Get Media Analytics (Cached)
```http
GET /api/analytics/media/:id/analytics?days=30
Authorization: Bearer <jwt-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "mediaId",
      "title": "Sample Video",
      "type": "video"
    },
    "analytics": {
      "total_views": 174,
      "unique_ips": 122,
      "views_per_day": {
        "2025-08-01": 34,
        "2025-08-02": 56
      },
      "recent_views": [
        {
          "ip": "192.168.1.1",
          "timestamp": "2025-09-04T14:30:00.000Z",
          "user_agent": "Mozilla/5.0..."
        }
      ],
      "top_countries": [
        {
          "country": "USA",
          "views": 89
        }
      ],
      "time_period": {
        "start": "2025-08-05",
        "end": "2025-09-04",
        "days": 30
      }
    }
  },
  "cache": false
}
```

#### 3. Get Analytics Dashboard
```http
GET /api/analytics/dashboard
Authorization: Bearer <jwt-token>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "total_media": 5,
    "total_views": 250,
    "total_unique_views": 150,
    "media_analytics": [
      {
        "media_id": "mediaId",
        "title": "Sample Video",
        "type": "video",
        "total_views": 174,
        "unique_ips": 122,
        "last_viewed": "2025-09-04T14:30:00.000Z"
      }
    ]
  }
}
```

### Health Check Route

```http
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Media Platform API is running",
  "timestamp": "2025-09-08T12:00:00.000Z"
}
```

## 🗄️ Database Models

### AdminUser Model
- **email**: Unique user email
- **hashed_password**: Bcrypt hashed password
- **isVerified**: Email verification status
- **otp**: OTP verification data
- **resetPasswordOTP**: Password reset OTP
- **created_at**: Account creation timestamp

### MediaAsset Model
- **title**: Media title
- **type**: Media type (video/audio)
- **file_url**: URL to media file
- **created_by**: Reference to AdminUser
- **view_count**: Total view count
- **created_at**: Upload timestamp

### MediaViewLog Model
- **media_id**: Reference to MediaAsset
- **viewed_by_ip**: Viewer's IP address
- **user_agent**: Browser/client user agent
- **timestamp**: View timestamp
- **token_used**: Streaming token used

## ⚡ Redis Caching

The application uses Redis for caching analytics data to improve performance:

- **Cache Duration**: 1 hour (3600 seconds)
- **Cache Keys**: `media:{mediaId}:analytics:{days}`
- **Fallback**: Graceful degradation if Redis is unavailable
- **Non-blocking**: Cache operations don't block API responses

### Redis Configuration
```javascript
// Connection URL format
REDIS_URL=redis://127.0.0.1:6379

// Or for cloud Redis
REDIS_URL=redis://username:password@host:port
```

## 🔒 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **OTP Verification**: Time-limited 6-digit codes
4. **Streaming Tokens**: Short-lived tokens for media access
5. **IP Tracking**: View logging with IP addresses
6. **Rate Limiting**: Built-in protection against abuse
7. **CORS**: Cross-origin request handling
8. **Helmet**: Security headers middleware

## 📧 Email Configuration

The application uses Gmail SMTP for sending emails. To set up:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password for the application
3. Use the App Password in the `EMAIL_PASSWORD` environment variable

**Supported Email Features:**
- OTP verification emails
- Password reset emails
- HTML formatted email templates

## 🧪 Testing

The project includes comprehensive Jest test suites for authentication and analytics.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Test Structure

- **`tests/setup.js`**: Global test setup and teardown
- **`tests/auth.test.js`**: Authentication flow tests
- **`tests/analytics.test.js`**: Analytics API tests

### Test Features

- Database connection management
- Redis connection cleanup
- User authentication testing
- Analytics endpoint validation
- Error handling verification

### Sample Test Commands

```bash
# Test authentication endpoints
npm test -- --testNamePattern="Auth Routes"

# Test analytics with caching
npm test -- --testNamePattern="Analytics Routes"

# Run tests with verbose output
npm test -- --verbose
```

## 🐳 Docker Deployment

### Docker Compose (Recommended)

The `docker-compose.yml` includes:
- **App Service**: Node.js application
- **Redis Service**: Redis cache server
- **Environment Files**: Automatic `.env` loading
- **Port Mapping**: 5000:5000 for app, 6379:6379 for Redis

```yaml
services:
  app:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Production Considerations

- Use external Redis service (AWS ElastiCache, Redis Cloud)
- Set proper environment variables
- Configure reverse proxy (Nginx)
- Enable SSL/TLS certificates
- Set up monitoring and logging

## 📊 Performance Monitoring

### Metrics to Monitor

1. **API Response Times**: Especially analytics endpoints
2. **Cache Hit Rates**: Redis cache effectiveness
3. **Database Query Performance**: MongoDB operations
4. **Memory Usage**: Node.js application memory
5. **Error Rates**: 4xx/5xx HTTP responses

### Recommended Tools

- **APM**: New Relic, DataDog, or Sentry
- **Database Monitoring**: MongoDB Atlas monitoring
- **Cache Monitoring**: Redis monitoring tools
- **Load Testing**: Artillery, k6, or Apache JMeter

## 🚨 Rate Limiting

View logging is rate-limited to prevent abuse:

- **Endpoint**: `POST /api/analytics/media/:id/view`
- **Limit**: Configurable (default: 100 requests per hour per IP)
- **Response**: 429 Too Many Requests when exceeded

## ⚠️ Important Notes

1. **Streaming Tokens**: Expire after 10 minutes for security
2. **OTP Codes**: Expire after 10 minutes
3. **JWT Tokens**: Default expiry of 7 days
4. **File Storage**: Currently stores URLs, not actual files
5. **Email Service**: Requires Gmail App Password setup
6. **Redis Caching**: Analytics cached for 1 hour
7. **Rate Limiting**: View logging has IP-based limits

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
- Ensure MongoDB is running locally or cloud connection string is correct
- Check firewall settings for cloud databases

### Redis Connection Issues
- Verify Redis server is running on the specified port
- Check REDIS_URL environment variable
- Application gracefully handles Redis unavailability

### Email Not Sending
- Verify Gmail App Password is correctly set
- Check EMAIL_USER and EMAIL_PASSWORD environment variables

### JWT Token Issues
- Ensure JWT_SECRET is set and consistent
- Check token expiration settings

### CORS Issues
- Frontend URL should be added to CORS configuration if needed
- Verify API endpoint URLs

### Docker Issues
- Ensure Docker and Docker Compose are installed
- Check port conflicts (5000, 6379)
- Verify `.env` file is properly configured

### Test Issues
- Ensure test database is accessible
- Check if Redis is available for tests
- Clean test data between runs

## 📈 Scaling Considerations

### Horizontal Scaling
- Use Redis Cluster for cache scaling
- Implement MongoDB replica sets
- Load balance multiple Node.js instances

### Performance Optimization
- Implement database indexing
- Add CDN for media files
- Use streaming for large files
- Implement pagination for all list endpoints

### Monitoring & Alerting
- Set up health checks
- Monitor cache hit ratios
- Track API response times
- Alert on error rate spikes

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review error logs for debugging information
- Test with Postman collection (if available)
