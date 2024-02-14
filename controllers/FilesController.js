const mimeTypes = require('mime-types');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const userUtils = require('../utils/getUserId');
const redisClient = require('../utils/redis');
const fileQueue = require('../worker');

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const redisToken = await redisClient.get(`auth_${token}`);
      if (!redisToken) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { userId } = await userUtils.getIdAndKey(req);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      if (!name) {
        return res.status(400).send({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).send({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).send({ error: 'Missing data' });
      }

      if (parentId !== 0) {
        if (!ObjectId.isValid(parentId)) {
          return res.status(400).send({ error: 'Parent not found' });
        }
        const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).send({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).send({ error: 'Parent is not a folder' });
        }
      }

      const fileDoc = {
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      if (type === 'file' || type === 'image') {
        const fileData = Buffer.from(data, 'base64');
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const fileName = `${uuidv4()}${path.extname(name)}`;
        const localPath = path.join(folderPath, fileName);
        fs.writeFileSync(localPath, fileData);
        fileDoc.localPath = localPath;

        fileQueue.add({ userId: userId.toString(), fileId: fileDoc._id.toString() });
      }

      const result = await dbClient.db.collection('files').insertOne(fileDoc);
      const { insertedId } = result;

      delete fileDoc._id;
      delete fileDoc.localPath;
      fileDoc.id = insertedId;

      const responseObj = {
        id: fileDoc.id,
        ...fileDoc,
      };

      return res.status(201).send(responseObj);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const redisToken = await redisClient.get(`auth_${token}`);
      if (!redisToken) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { userId } = await userUtils.getIdAndKey(req);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });
      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      const sanitizedFile = {
        id: fileId,
        ...file,
        localPath: undefined,
        _id: undefined,
      };

      return res.status(200).send(sanitizedFile);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const redisToken = await redisClient.get(`auth_${token}`);
      if (!redisToken) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { userId } = await userUtils.getIdAndKey(req);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      let parentId = req.query.parentId || '0';
      if (parentId === '0') parentId = 0;

      let page = Number(req.query.page) || 0;
      if (Number.isNaN(page)) page = 0;

      const aggregationMatch = { $and: [{ parentId }] };
      let aggregateData = [{ $match: aggregationMatch }, { $skip: page * 20 }, { $limit: 20 }];
      if (parentId === 0) aggregateData = [{ $skip: page * 20 }, { $limit: 20 }];

      const filesCursor = await dbClient.db.collection('files').aggregate(aggregateData);
      const files = await filesCursor.toArray();

      const sanitizedFiles = files.map((file) => ({
        id: file._id.toString(),
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
        localPath: undefined,
        _id: undefined,
      }));

      return res.status(200).send(sanitizedFiles);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async putPublish(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const redisToken = await redisClient.get(`auth_${token}`);
      if (!redisToken) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { userId } = await userUtils.getIdAndKey(req);
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });

      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });

      const sanitizedFile = {
        id: fileId,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
      };

      return res.status(200).send(sanitizedFile);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      const token = req.header('X-Token');
      if (!token) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const redisToken = await redisClient.get(`auth_${token}`);
      if (!redisToken) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const { userId } = await userUtils.getIdAndKey(req);

      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });

      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });

      const sanitizedFile = {
        id: fileId,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
      };

      return res.status(200).send(sanitizedFile);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }

  static async getFile(req, res) {
    try {
      const fileId = req.params.id || '';
      const size = req.query.size || 0;

      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
      if (!file) {
        return res.status(404).send({ error: 'Not found' });
      }

      const {
        isPublic, userId, type, name, localPath,
      } = file;

      const { userId: authenticatedUserId } = await userUtils.getIdAndKey(req);
      const isOwner = authenticatedUserId && authenticatedUserId.toString() === userId.toString();

      if (!isPublic && !isOwner) {
        return res.status(404).send({ error: 'Not found' });
      }

      if (type === 'folder') {
        return res.status(400).send({ error: "A folder doesn't have content" });
      }

      let filePath = localPath;
      if (!Number.isNaN(Number(size)) && [500, 250, 100].includes(Number(size))) {
        filePath += `_${size}`;
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).send({ error: 'Not found' });
      }

      const dataFile = fs.readFileSync(filePath);
      const mimeType = mimeTypes.lookup(name);

      res.setHeader('Content-Type', mimeType);
      return res.send(dataFile);
    } catch (error) {
      return res.status(404).send({ error: 'Not found' });
    }
  }
}

export default FilesController;
