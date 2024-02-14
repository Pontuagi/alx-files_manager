const { createClient } = require('redis-mock');
const RedisClient = require('./utils/redis');

// Mock the createClient function to return a mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => createClient()),
}));

const redisClient = new RedisClient();

describe('redisClient', () => {
  // Test the isAlive method
  describe('isAlive', () => {
    it('should return true if the client is connected', () => {
      // Set the connected status of the mock client to true
      redisClient.client.connected = true;
      // Expect isAlive() to return true
      expect(redisClient.isAlive()).toBe(true);
    });

    it('should return false if the client is not connected', () => {
      // Set the connected status of the mock client to false
      redisClient.client.connected = false;
      // Expect isAlive() to return false
      expect(redisClient.isAlive()).toBe(false);
    });
  });

  // Test the get method
  describe('get', () => {
    it('should resolve with the value corresponding to the key', async () => {
      // Set up the mock Redis client to return a value for the key
      redisClient.client.set('key', 'value');
      // Expect get('key') to resolve with 'value'
      await expect(redisClient.get('key')).resolves.toBe('value');
    });

    it('should reject with an error if an error occurs', async () => {
      // Set up the mock Redis client to throw an error
      jest.spyOn(redisClient.client, 'get').mockImplementation((key, callback) => callback(new Error('Test error')));
      // Expect get('key') to reject with an error
      await expect(redisClient.get('key')).rejects.toThrow('Test error');
    });
  });

  // Test the set method
  describe('set', () => {
    // Write your tests for the set method here
  });

  // Test the del method
  describe('del', () => {
    // Write your tests for the del method here
  });
});
