const DBClient = require('./utils/db');

// Mocking process.env.DB_HOST, process.env.DB_PORT, and process.env.DB_DATABASE
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '27017';
process.env.DB_DATABASE = 'test_database';

// Mock MongoClient
jest.mock('mongodb', () => {
  const { MongoClient } = jest.requireActual('mongodb');
  return {
    MongoClient: {
      connect: jest.fn(),
      db: jest.fn(),
    },
  };
});

describe('dBClient', () => {
  let dbClient;

  beforeAll(() => {
    dbClient = new DBClient();
  });

  afterAll(() => {
    // Close the MongoDB client connection after all tests
    dbClient.client.close();
  });

  describe('isAlive', () => {
    it('should return true if the MongoDB client is connected', () => {
      expect(dbClient.isAlive()).toBe(true);
    });
  });

  describe('nbUsers', () => {
    it('should return the number of users in the database', async () => {
      // Mock MongoDB collection methods
      jest.spyOn(dbClient.client.db().collection('users'), 'countDocuments').mockImplementation(() => Promise.resolve(5));
      const count = await dbClient.nbUsers();
      expect(count).toBe(5);
    });
  });

  describe('nbFiles', () => {
    it('should return the number of files in the database', async () => {
      // Mock MongoDB collection methods
      jest.spyOn(dbClient.client.db().collection('files'), 'countDocuments').mockImplementation(() => Promise.resolve(10));
      const count = await dbClient.nbFiles();
      expect(count).toBe(10);
    });
  });
});
