// tests/analytics.test.js
const request = require('supertest');
const app = require('../server');
const AdminUser = require('../models/AdminUser');

describe('Analytics Routes', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Clean up any existing test data first
    await AdminUser.deleteMany({ email: 'test@example.com' });
    
    // Create test user and login to get token
    testUser = new AdminUser({
      name: 'Test User',
      email: 'test@example.com',
      hashed_password: 'testpassword123', // This will be hashed by pre-save
      isVerified: true
    });
    await testUser.save();

    // Login to get token - use the same credentials as the created user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com', // Use the test user email
        password: 'testpassword123' // Use the test user password
      });
    
    
    authToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    await AdminUser.deleteMany({ email: 'test@example.com' });
  });

  it('should get media analytics with valid token', async () => {
    const mediaId = '68b99c553562ad6cad0fe7a8';
    
    const res = await request(app)
      .get(`/api/analytics/media/${mediaId}/analytics`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');
    
    console.log('Analytics response:', res.statusCode, res.body);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.media).toBeDefined();
    expect(res.body.data.analytics).toBeDefined();
  });

  it('should fail without authorization token', async () => {
    const mediaId = '68b99c553562ad6cad0fe7a8';
    
    const res = await request(app)
      .get(`/api/analytics/media/${mediaId}/analytics`)
      .set('Content-Type', 'application/json');
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail with invalid media ID', async () => {
    const invalidMediaId = 'invalid-id-123';
    
    const res = await request(app)
      .get(`/api/analytics/media/${invalidMediaId}/analytics`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');
    
    // Could be 404, 400, or 500 depending on your implementation
    expect([400, 404, 500]).toContain(res.statusCode);
  });
});