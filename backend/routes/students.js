const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const { protect, authorize, parentOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students (admin/teacher) or parent's children (parent)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, class: className } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'parent') {
      // Parents can only see their children
      query.parentId = req.user._id;
    } else if (req.user.role === 'admin' || req.user.role === 'teacher') {
      // Admin and teachers can see all students
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ];
      }
      if (className) {
        query.class = className;
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const students = await Student.find(query)
      .populate('parentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching students'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('parentId', 'name email');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role === 'parent') {
      // Parents can only view their own children
      if (student.parentId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student'
    });
  }
});

// @route   POST /api/students
// @desc    Create new student (admin only)
// @access  Private/Admin
router.post('/', [
  protect,
  authorize('admin'),
  body('name').trim().notEmpty().withMessage('Student name is required'),
  body('parentId').isMongoId().withMessage('Valid parent ID is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('grade').trim().notEmpty().withMessage('Grade is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender')
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

    const { name, parentId, class: className, grade, dateOfBirth, gender, address, phoneNumber, emergencyContact } = req.body;

    // Verify parent exists and is actually a parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent ID'
      });
    }

    // Generate unique student ID
    const studentId = `STU${Date.now().toString().slice(-6)}`;

    // Create student
    const student = new Student({
      studentId,
      name,
      parentId,
      class: className,
      grade,
      dateOfBirth,
      gender,
      address,
      phoneNumber,
      emergencyContact
    });

    await student.save();

    // Create corresponding user account for the student
    const studentUser = new User({
      name,
      email: `${studentId.toLowerCase()}@school.edu`,
      password: studentId, // Default password, should be changed on first login
      role: 'student',
      parentId
    });

    await studentUser.save();

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        student,
        userCredentials: {
          email: studentUser.email,
          password: studentId,
          role: 'student'
        }
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating student'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student (admin only)
// @access  Private/Admin
router.put('/:id', [
  protect,
  authorize('admin'),
  body('parentId').optional().isMongoId().withMessage('Valid parent ID is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
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

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const { name, parentId, class: className, grade, dateOfBirth, gender, address, phoneNumber, emergencyContact, isActive } = req.body;

    // Validate parentId if provided
    if (parentId) {
      const parent = await User.findById(parentId);
      if (!parent || parent.role !== 'parent') {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent ID'
        });
      }
    }

    // Update fields
    if (name) student.name = name;
    if (parentId) student.parentId = parentId;
    if (className) student.class = className;
    if (grade) student.grade = grade;
    if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (address) student.address = address;
    if (phoneNumber) student.phoneNumber = phoneNumber;
    if (emergencyContact) student.emergencyContact = emergencyContact;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating student'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (admin only)
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete corresponding user account
    await User.deleteOne({ parentId: student.parentId, role: 'student' });

    // Delete student record
    await Student.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting student'
    });
  }
});

// @route   GET /api/students/stats
// @desc    Get student statistics (admin only)
// @access  Private/Admin
router.get('/stats/dashboard', [protect, authorize('admin')], async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });

    const classStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const gradeStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        classStats,
        gradeStats
      }
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student statistics'
    });
  }
});

module.exports = router;
