const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vision-link-system');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query, body } = req;

  try {
    // Login endpoint
    if (method === 'POST' && !query.action) {
      const { email, password } = body;
      
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // Register endpoint
    if (method === 'POST' && query.action === 'register') {
      const { name, email, password, role } = body;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'student'
      });

      await user.save();

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // Get current user
    if (method === 'GET' && query.action === 'me') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
