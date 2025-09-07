// tests/auth.test.js
const request = require('supertest');
const app = require('../server');
const AdminUser = require('../models/AdminUser');

describe('Auth Routes', () => {
  let testUser;

  beforeAll(async () => {
    // Create test user using the schema's normal flow
    testUser = new AdminUser({
      name: 'Test User',
      email: 'nehasindhwani0110@gmail.com',
      hashed_password: 'NehaSindhwani01', // This will be hashed by pre-save middleware
      isVerified: true
    });
    await testUser.save();
  });

  afterAll(async () => {
    await AdminUser.deleteMany({ 
      email: { $in: ['nehasindhwani0110@gmail.com', 'test@example.com'] } 
    });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: 'nehasindhwani0110@gmail.com', 
        password: 'NehaSindhwani01' 
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: 'test@example.com', 
        password: 'WrongPassword' 
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Debug test to verify password hashing
  it('should verify password is hashed correctly', async () => {
    const user = await AdminUser.findOne({ email: 'nehasindhwani0110@gmail.com' });
    console.log('Stored hashed password:', user.hashed_password);
    console.log('Is plain text:', user.hashed_password === 'NehaSindhwani01');
    
    const isMatch = await user.comparePassword('NehaSindhwani01');
    console.log('Password matches:', isMatch);
    
    expect(isMatch).toBe(true);
  });
});