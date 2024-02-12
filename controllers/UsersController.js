const crypto = require('crypto');
const dbClient = require('../utils/db');

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const existingUser = await dbClient.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = await dbClient.createUser(email, hashedPassword);

      res.status(201).json({ email: newUser.email, id: newUser._id });
    } catch (error) {
      console.error('Error creating new user:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }

    return undefined;
  },
};

module.exports = UsersController;
