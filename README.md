# Media Platform Backend

A secure media streaming platform backend built with Node.js, Express, and MongoDB. This API provides user authentication, media asset management, and secure streaming capabilities with token-based access control.

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

- **Security Features**
  - JWT token authentication
  - Password hashing with bcrypt
  - Rate limiting protection
  - CORS enabled
  - Helmet security headers

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Gmail account for email services (or other SMTP provider)

## 🛠️ Installation

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

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
media-platform-backend/
├── config/
│   ├── database.js          # MongoDB connection setup
│   └── jwt.js              # JWT configuration utilities
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── mediaController.js   # Media management logic
├── middleware/
│   ├── auth.js             # JWT verification middleware
│   └── errorhandler.js     # Error handling middleware
├── models/
│   ├── AdminUser.js        # User model with authentication
│   ├── MediaAsset.js       # Media asset model
│   └── MediaViewLog.js     # View tracking model
├── routes/
│   ├── auth.js             # Authentication routes
│   └── media.js            # Media management routes
├── utils/
│   └── emailService.js     # Email sending utilities
├── .gitignore              # Git ignore rules
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
- **created_at**: Upload timestamp

### MediaViewLog Model
- **media_id**: Reference to MediaAsset
- **viewed_by_ip**: Viewer's IP address
- **timestamp**: View timestamp
- **token_used**: Streaming token used

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

You can test the API using tools like:
- **Postman**: Import the API endpoints
- **curl**: Command-line testing
- **Thunder Client**: VS Code extension

### Sample Test Flow:
1. Sign up with email/password
2. Verify OTP from email
3. Login to get JWT token
4. Add media assets
5. Generate streaming URLs
6. Access media streams

## ⚠️ Important Notes

1. **Streaming Tokens**: Expire after 10 minutes for security
2. **OTP Codes**: Expire after 10 minutes
3. **JWT Tokens**: Default expiry of 7 days
4. **File Storage**: Currently stores URLs, not actual files
5. **Email Service**: Requires Gmail App Password setup



## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
- Ensure MongoDB is running locally or cloud connection string is correct
- Check firewall settings for cloud databases

### Email Not Sending
- Verify Gmail App Password is correctly set
- Check EMAIL_USER and EMAIL_PASSWORD environment variables

### JWT Token Issues
- Ensure JWT_SECRET is set and consistent
- Check token expiration settings

### CORS Issues
- Frontend URL should be added to CORS configuration if needed
- Verify API endpoint URLs

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review error logs for debugging information
