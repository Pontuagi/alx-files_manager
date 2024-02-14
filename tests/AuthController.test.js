const AuthController = require('../controllers/AuthController');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// Mock the dbClient and redisClient methods
jest.mock('../utils/db', () => ({
  getUserByEmailAndPassword: jest.fn(),
}));
jest.mock('../utils/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

describe('authController', () => {
  describe('getConnect', () => {
    it('should return status 401 if authorization header is missing', async () => {
      const req = { headers: {} };
      const res = { status: jest.fn(() => res), json: jest.fn() };

      await AuthController.getConnect(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('getDisconnect', () => {
    it('should return status 401 if token is missing', async () => {
      const req = { headers: {} };
      const res = { status: jest.fn(() => res), json: jest.fn() };

      await AuthController.getDisconnect(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });
});
