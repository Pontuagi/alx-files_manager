const AppController = require('../controllers/AppController');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// Mock the dbClient.isAlive() and redisClient.isAlive() methods
jest.mock('../utils/db', () => ({
  isAlive: jest.fn(),
  nbUsers: jest.fn(),
  nbFiles: jest.fn(),
}));
jest.mock('../utils/redis', () => ({
  isAlive: jest.fn(),
}));

describe('appController', () => {
  describe('getStatus', () => {
    it('should return status 200 if both Redis and DB are alive', () => {
      // Set up mock behavior for isAlive methods
      dbClient.isAlive.mockReturnValue(true);
      redisClient.isAlive.mockReturnValue(true);

      // Mock Express response object
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      AppController.getStatus({}, res);

      // Expect status 200 with { redis: true, db: true } JSON response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ redis: true, db: true });
    });

    it('should return status 500 if either Redis or DB is not alive', () => {
      // Set up mock behavior for isAlive methods
      dbClient.isAlive.mockReturnValue(true);
      redisClient.isAlive.mockReturnValue(false);

      // Mock Express response object
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      AppController.getStatus({}, res);

      // Expect status 500 with { redis: false, db: true } JSON response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ redis: false, db: true });
    });
  });

  describe('getStats', () => {
    it('should return status 200 with users and files counts', async () => {
      // Set up mock behavior for nbUsers and nbFiles methods
      dbClient.nbUsers.mockResolvedValue(10);
      dbClient.nbFiles.mockResolvedValue(20);

      // Mock Express response object
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };
      await AppController.getStats({}, res);

      // Expect status 200 with { users: 10, files: 20 } JSON response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ users: 10, files: 20 });
    });

    it('should return status 500 if an error occurs', async () => {
      // Set up mock behavior for nbUsers method to throw an error
      dbClient.nbUsers.mockRejectedValue(new Error('Test error'));

      // Mock Express response object
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      await AppController.getStats({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});
