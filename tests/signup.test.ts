import supertest from 'supertest';
import app from '../src/app';

let server: any;

describe('Signup API Endpoint', () => {
  beforeAll((done) => {
    server = app.listen(3000, () => {
      console.log('Server is running on port 3000');
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      console.log('Server is closed');
      done();
    });
  });

  it('should create a valid accounts', async () => {
    const userData = [
      { username: 'user8', email: 'user8@example.com', password: 'password8' },
    ];

    for (const data of userData) {
      const response = await supertest(app)
        .post('/auth/register')
        .send(data);

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('User created successfully');
      expect(response.body).toHaveProperty('accessToken');
    }
  }, 30000);

  it('should handle incomplete data', async () => {
    const incompleteData = { username: 'incomplete_user', password: 'incomplete_password' };

    const response = await supertest(app)
      .post('/auth/register')
      .send(incompleteData);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('All fields are required');
  });

  it('should handle duplicate data', async () => {
    const duplicateData = { username: 'user6', email: 'user6@example.com', password: 'password6' };

    const response = await supertest(app)
      .post('/auth/register')
      .send(duplicateData);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('User already exists!');
  });
});
