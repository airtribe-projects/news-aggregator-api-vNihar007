const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/users');
const authMiddleware = require('./middleware/auth');
const { userSchema, newsQuerySchema } = require('./validation');
const newsService = require('./services');
const app = express();
const port = 3000;

const JWT_SECRET = 'jwt_secret';
const MONGO_URL = 'mongodb+srv://varun:varun123@cluster0.bq8bj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URL, {})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas', error));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, (err) => {
  if (err) {
    return console.log('Something bad happened', err);
  }
  console.log(`Server is listening on ${port}`);
});

app.post('/users/signup', async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).send({ message: 'Validation Error', error: error.details[0].message });
  }

  const { name, email, password, preferences = [] } = value;
  try {
    const user = new User({ username: name, email, password, preferences });
    await user.save();
    res.status(200).send('User created');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send({ message: 'Duplicate key error', field: err.keyValue });
    }
    res.status(500).send('Error creating user');
  }
});

app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('User not found');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ email: user.email }, JWT_SECRET);
    res.status(200).send({ token });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).send('Error logging in');
  }
});

app.get('/users/preferences', authMiddleware, async (req, res) => {
  try {
    console.log('Authenticated User:', req.user);

    const user = await User.findOne({ email: req.user.email });
    console.log('Retrieved User:', user);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).json({ preferences: user.preferences });
  } catch (error) {
    console.error('Error Fetching Preferences:', error.message);
    res.status(500).send('Error fetching preferences');
  }
});

app.put('/users/preferences', authMiddleware, async (req, res) => {
  const { preferences } = req.body;
  if (!preferences || !Array.isArray(preferences)) {
    return res.status(400).send('Missing or invalid preferences');
  }
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.preferences = preferences;
    await user.save();
    res.status(200).json({ preferences });
  } catch (error) {
    console.error('Error Updating Preferences:', error.message);
    res.status(500).send('Error updating preferences');
  }
});

app.get('/news', authMiddleware, async (req, res) => {
  console.log('Authorization Header:', req.headers.authorization);

  const { error, value } = newsQuerySchema.validate(req.query);
  if (error) {
    console.error('Validation Error:', error.details[0].message);
    return res.status(400).send({ message: 'Validation Error', details: error.details[0].message });
  }
  const { query, dateStart, dateEnd } = value;

  try {
    const news = await newsService.getNews(query, dateStart, dateEnd);
    if (!news || Object.keys(news).length === 0) {
      console.error('No news found');
      return res.status(404).json({ message: 'No news found' });
    }
    res.status(200).json(news);
  } catch (error) {
    console.error('Error Fetching News:', error.message);
    res.status(500).send('Error fetching news');
  }
});

module.exports = app;