const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const app = require('../app');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const FilesController = require('../controllers/FilesController');

jest.mock('../utils/db');
jest.mock('../utils/redis');

describe('filesController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('postUpload', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).post('/files').send({});

      expect(response.status).toBe(401);
    });
  });

  describe('getShow', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).get('/files/123');

      expect(response.status).toBe(401);
    });
  });

  describe('getIndex', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).get('/files');

      expect(response.status).toBe(401);
    });
  });

  describe('putPublish', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).put('/files/123/publish');

      expect(response.status).toBe(401);
    });
  });

  describe('putUnpublish', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).put('/files/123/unpublish');

      expect(response.status).toBe(401);
    });
  });

  describe('getFile', () => {
    it('should return status 401 if token is missing', async () => {
      const response = await request(app).get('/files/123/data');

      expect(response.status).toBe(401);
    });
  });
});
