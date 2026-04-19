const express = require('express');
const { body, validationResult } = require('express-validator');
const Result = require('../models/Result');
const Student = require('../models/Student');
const { protect, authorize, parentOnly, studentOnly } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate grade from score
const calculateGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
};

// @route   GET /api/results
// @desc    Get results (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, term, academicYear, studentId } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'student') {
      // Students can only see their own results
      const student = await Student.findOne({ parentId: req.user._id });
      if (student) {
        query.studentId = student._id;
      }
    } else if (req.user.role === 'parent') {
      // Parents can only see their children's results
      const children = await Student.find({ parentId: req.user._id });
      query.studentId = { $in: children.map(child => child._id) };
    } else if (req.user.role === 'admin' || req.user.role === 'teacher') {
      // Admin and teachers can see all results
      if (studentId) query.studentId = studentId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Additional filters
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const results = await Result.find(query)
      .populate('studentId', 'name studentId class grade')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Result.countDocuments(query);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total
        }
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching results'
    });
  }
});

// @route   GET /api/results/:id
// @desc    Get result by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name studentId class grade parentId')
      .populate('uploadedBy', 'name email');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student') {
      // Students can only view their own results
      const student = await Student.findOne({ parentId: req.user._id });
      if (!student || student._id.toString() !== result.studentId._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'parent') {
      // Parents can only view their children's results
      if (result.studentId.parentId.toString() !== req.user._id.toString()) {
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
      data: { result }
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching result'
    });
  }
});

// @route   POST /api/results
// @desc    Create new result (admin/teacher only)
// @access  Private/Admin/Teacher
router.post('/', [
  protect,
  authorize('admin', 'teacher'),
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('term').isIn(['First Term', 'Second Term', 'Third Term']).withMessage('Invalid term'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('subjects.*.subject').trim().notEmpty().withMessage('Subject name is required'),
  body('subjects.*.score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100')
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

    const { studentId, term, academicYear, subjects, classPosition, totalStudentsInClass, teacherRemarks, principalRemarks, nextTermBegins } = req.body;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if result already exists for this student, term, and year
    const existingResult = await Result.findOne({ studentId, term, academicYear });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student in this term and academic year'
      });
    }

    // Calculate grades for each subject
    const subjectsWithGrades = subjects.map(subject => ({
      ...subject,
      grade: calculateGrade(subject.score)
    }));

    // Create result
    const result = new Result({
      studentId,
      term,
      academicYear,
      subjects: subjectsWithGrades,
      classPosition,
      totalStudentsInClass,
      teacherRemarks,
      principalRemarks,
      nextTermBegins,
      uploadedBy: req.user._id
    });

    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate('studentId', 'name studentId class grade')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: { result: populatedResult }
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating result'
    });
  }
});

// @route   PUT /api/results/:id
// @desc    Update result (admin/teacher only)
// @access  Private/Admin/Teacher
router.put('/:id', [
  protect,
  authorize('admin', 'teacher'),
  body('subjects').optional().isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('subjects.*.subject').optional().trim().notEmpty().withMessage('Subject name is required'),
  body('subjects.*.score').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100')
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

    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    const { subjects, classPosition, totalStudentsInClass, teacherRemarks, principalRemarks, nextTermBegins } = req.body;

    // Update fields
    if (subjects) {
      const subjectsWithGrades = subjects.map(subject => ({
        ...subject,
        grade: calculateGrade(subject.score)
      }));
      result.subjects = subjectsWithGrades;
    }
    if (classPosition !== undefined) result.classPosition = classPosition;
    if (totalStudentsInClass !== undefined) result.totalStudentsInClass = totalStudentsInClass;
    if (teacherRemarks !== undefined) result.teacherRemarks = teacherRemarks;
    if (principalRemarks !== undefined) result.principalRemarks = principalRemarks;
    if (nextTermBegins !== undefined) result.nextTermBegins = nextTermBegins;

    await result.save();

    const populatedResult = await Result.findById(result._id)
      .populate('studentId', 'name studentId class grade')
      .populate('uploadedBy', 'name email');

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: { result: populatedResult }
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating result'
    });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete result (admin only)
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    await Result.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting result'
    });
  }
});

// @route   GET /api/results/student/:studentId
// @desc    Get results for a specific student
// @access  Private
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization
    if (req.user.role === 'parent') {
      // Parents can only view their children's results
      if (student.parentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (req.user.role === 'student') {
      // Students can only view their own results
      const studentRecord = await Student.findOne({ parentId: req.user._id });
      if (!studentRecord || studentRecord._id.toString() !== studentId) {
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

    let query = { studentId };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const results = await Result.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching student results'
    });
  }
});

// @route   GET /api/results/stats
// @desc    Get result statistics (admin only)
// @access  Private/Admin
router.get('/stats/dashboard', [protect, authorize('admin')], async (req, res) => {
  try {
    const totalResults = await Result.countDocuments();
    
    const termStats = await Result.aggregate([
      {
        $group: {
          _id: '$term',
          count: { $sum: 1 }
        }
      }
    ]);

    const yearStats = await Result.aggregate([
      {
        $group: {
          _id: '$academicYear',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Average performance by term
    const performanceStats = await Result.aggregate([
      {
        $group: {
          _id: '$term',
          averageScore: { $avg: '$averageScore' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalResults,
        termStats: termStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        yearStats: yearStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        performanceStats: performanceStats.reduce((acc, stat) => {
          acc[stat._id] = Math.round(stat.averageScore * 100) / 100;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get result stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching result statistics'
    });
  }
});

module.exports = router;
