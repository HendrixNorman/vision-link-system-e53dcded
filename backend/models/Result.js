const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  term: {
    type: String,
    required: [true, 'Term is required'],
    enum: ['First Term', 'Second Term', 'Third Term'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  subjects: [{
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be less than 0'],
      max: [100, 'Score cannot exceed 100']
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: ['A', 'B', 'C', 'D', 'E', 'F'],
      uppercase: true
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    }
  }],
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  averageScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  classPosition: {
    type: Number,
    min: 1
  },
  totalStudentsInClass: {
    type: Number,
    min: 1
  },
  teacherRemarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Teacher remarks cannot exceed 1000 characters']
  },
  principalRemarks: {
    type: String,
    trim: true,
    maxlength: [1000, 'Principal remarks cannot exceed 1000 characters']
  },
  nextTermBegins: {
    type: Date
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
resultSchema.index({ studentId: 1, term: 1, academicYear: 1 }, { unique: true });
resultSchema.index({ academicYear: 1, term: 1 });

// Calculate total and average scores before saving
resultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalScore = this.subjects.reduce((sum, subject) => sum + subject.score, 0);
    this.averageScore = Math.round((this.totalScore / this.subjects.length) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);
