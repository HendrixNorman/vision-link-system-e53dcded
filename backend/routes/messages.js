const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get messages (filtered by user role and target)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, target, priority, category, unread } = req.query;
    
    let query = { isActive: true };
    
    // Filter out expired messages
    query.$or = [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ];

    // Filter based on user role
    if (req.user.role === 'admin') {
      // Admins can see all messages
      if (target) query.target = target;
    } else if (req.user.role === 'parent') {
      // Parents see messages targeted to 'all', 'parents', or specific to them
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'parents' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    } else if (req.user.role === 'student') {
      // Students see messages targeted to 'all', 'students', or specific to them
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'students' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    } else if (req.user.role === 'teacher') {
      // Teachers see messages targeted to 'all', 'teachers', or specific to them
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'teachers' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    }

    // Additional filters
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (unread === 'true') {
      query['readBy.user'] = { $ne: req.user._id };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .populate('specificUsers', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalMessages: total
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages'
    });
  }
});

// @route   GET /api/messages/:id
// @desc    Get message by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email role')
      .populate('specificUsers', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if message is expired
    if (message.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'Message has expired'
      });
    }

    // Check authorization based on target
    if (req.user.role !== 'admin') {
      let hasAccess = false;
      
      if (message.target === 'all') {
        hasAccess = true;
      } else if (message.target === 'parents' && req.user.role === 'parent') {
        hasAccess = true;
      } else if (message.target === 'students' && req.user.role === 'student') {
        hasAccess = true;
      } else if (message.target === 'teachers' && req.user.role === 'teacher') {
        hasAccess = true;
      } else if (message.target === 'specific') {
        hasAccess = message.specificUsers.some(user => user._id.toString() === req.user._id.toString());
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Mark message as read
    message.markAsRead(req.user._id);
    await message.save();

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching message'
    });
  }
});

// @route   POST /api/messages
// @desc    Create new message (admin only)
// @access  Private/Admin
router.post('/', [
  protect,
  authorize('admin'),
  body('title').trim().notEmpty().withMessage('Message title is required'),
  body('content').trim().notEmpty().withMessage('Message content is required'),
  body('target').isIn(['all', 'parents', 'students', 'teachers', 'specific']).withMessage('Invalid target'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category').optional().isIn(['general', 'academic', 'administrative', 'emergency', 'event']).withMessage('Invalid category')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { title, content, target, specificUsers, priority, category, expiryDate } = req.body;

    // Validate specific users if target is 'specific'
    let validSpecificUsers = [];
    if (target === 'specific') {
      if (!specificUsers || !Array.isArray(specificUsers) || specificUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Specific users must be provided when target is "specific"'
        });
      }

      // Verify all specified users exist
      validSpecificUsers = await User.find({ '_id': { $in: specificUsers } });
      if (validSpecificUsers.length !== specificUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more specified users do not exist'
        });
      }
    }

    // Create message
    const message = new Message({
      title,
      content,
      target,
      specificUsers: target === 'specific' ? specificUsers : [],
      priority: priority || 'medium',
      category: category || 'general',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      sender: req.user._id
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('specificUsers', 'name email');

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating message'
    });
  }
});

// @route   PUT /api/messages/:id
// @desc    Update message (admin only)
// @access  Private/Admin
router.put('/:id', [
  protect,
  authorize('admin'),
  body('target').optional().isIn(['all', 'parents', 'students', 'teachers', 'specific']).withMessage('Invalid target'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category').optional().isIn(['general', 'academic', 'administrative', 'emergency', 'event']).withMessage('Invalid category')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const { title, content, target, specificUsers, priority, category, expiryDate, isActive } = req.body;

    // Validate specific users if target is being changed to 'specific'
    if (target === 'specific') {
      if (!specificUsers || !Array.isArray(specificUsers) || specificUsers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Specific users must be provided when target is "specific"'
        });
      }

      // Verify all specified users exist
      const validSpecificUsers = await User.find({ '_id': { $in: specificUsers } });
      if (validSpecificUsers.length !== specificUsers.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more specified users do not exist'
        });
      }
    }

    // Update fields
    if (title) message.title = title;
    if (content) message.content = content;
    if (target) {
      message.target = target;
      message.specificUsers = target === 'specific' ? specificUsers : [];
    }
    if (priority) message.priority = priority;
    if (category) message.category = category;
    if (expiryDate !== undefined) message.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) message.isActive = isActive;

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('specificUsers', 'name email');

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating message'
    });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete message (admin only)
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting message'
    });
  }
});

// @route   POST /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.post('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if message is expired
    if (message.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'Message has expired'
      });
    }

    // Mark as read
    message.markAsRead(req.user._id);
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking message as read'
    });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get count of unread messages for current user
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    let query = { 
      isActive: true,
      'readBy.user': { $ne: req.user._id }
    };
    
    // Filter out expired messages
    query.$or = [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ];

    // Filter based on user role
    if (req.user.role === 'admin') {
      // Admins see all unread messages
    } else if (req.user.role === 'parent') {
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'parents' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    } else if (req.user.role === 'student') {
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'students' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    } else if (req.user.role === 'teacher') {
      query.$and = [
        {
          $or: [
            { target: 'all' },
            { target: 'teachers' },
            { target: 'specific', specificUsers: req.user._id }
          ]
        }
      ];
    }

    const count = await Message.countDocuments(query);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching unread count'
    });
  }
});

// @route   GET /api/messages/stats
// @desc    Get message statistics (admin only)
// @access  Private/Admin
router.get('/stats/dashboard', [protect, authorize('admin')], async (req, res) => {
  try {
    const totalMessages = await Message.countDocuments();
    const activeMessages = await Message.countDocuments({ isActive: true });
    
    const targetStats = await Message.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$target',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Message.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Message.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalMessages,
        activeMessages,
        inactiveMessages: totalMessages - activeMessages,
        targetStats: targetStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        priorityStats: priorityStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        categoryStats: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching message statistics'
    });
  }
});

module.exports = router;
