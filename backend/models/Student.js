const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
studentSchema.index({ studentId: 1 });
studentSchema.index({ parentId: 1 });

module.exports = mongoose.model('Student', studentSchema);
