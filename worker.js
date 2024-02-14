const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.getFileById(userId, fileId);
  if (!file) {
    throw new Error('File not found');
  }

  if (file.type !== 'image') {
    // Do nothing if the file is not an image
    return;
  }

  const path = file.localPath;
  const thumbnail500 = await imageThumbnail(path, { width: 500 });
  const thumbnail250 = await imageThumbnail(path, { width: 250 });
  const thumbnail100 = await imageThumbnail(path, { width: 100 });

  const filenameWithoutExtension = path.substring(0, path.lastIndexOf('.'));
  await Promise.all([
    fs.writeFile(`${filenameWithoutExtension}_500.jpg`, thumbnail500),
    fs.writeFile(`${filenameWithoutExtension}_250.jpg`, thumbnail250),
    fs.writeFile(`${filenameWithoutExtension}_100.jpg`, thumbnail100),
  ]);
});
