const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('+password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized.`
      });
    }

    next();
  };
};

// Parent-only authorization - can only access their children's data
const parentOnly = async (req, res, next) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Parent access required.'
      });
    }

    // Add parent ID to request for filtering children's data
    req.parentId = req.user._id;
    next();
  } catch (error) {
    console.error('Parent authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in parent authorization'
    });
  }
};

// Student-only authorization - can only access their own data
const studentOnly = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student access required.'
      });
    }

    // Add student ID to request for filtering their data
    req.studentId = req.user._id;
    next();
  } catch (error) {
    console.error('Student authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in student authorization'
    });
  }
};

module.exports = {
  protect,
  authorize,
  parentOnly,
  studentOnly
};
