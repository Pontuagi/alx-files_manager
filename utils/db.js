// DBClient module
const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${dbHost}:${dbPort}/${dbName}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect((err) => {
      if (err) {
        console.error('MongoDB connection error:', err);
      }
    });
  }

  isAlive() {
    return !!this.client && !!this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    const db = this.client.db();
    const usersCollection = db.collection('users');
    const count = await usersCollection.countDocuments();
    return count;
  }

  async nbFiles() {
    const db = this.client.db();
    const filesCollection = db.collection('files');
    const count = await filesCollection.countDocuments();
    return count;
  }

  async getUserByEmail(email) {
    const db = this.client.db();
    const usersCollection = db.collection('users');
    return usersCollection.findOne({ email });
  }

  async createUser(email, password) {
    // try {
    const db = this.client.db();
    const usersCollection = db.collection('users');
    const result = await usersCollection.insertOne({ email, password });
    return { email, _id: result.insertedId };
    // } catch (error) {
    //  console.error('Error creating user:', error);
    //  throw new Error('Failed to create user');
    // }*/
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
