const Student = require('../models/Student');
const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class MongoDBService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Student operations
  async createStudent(studentData) {
    try {
      const student = new Student(studentData);
      await student.save();
      return student;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Student with this registration number or email already exists');
      }
      throw error;
    }
  }

  async findStudentByRegNoAndDOB(regNo, dob) {
    try {
      const student = await Student.findOne({ regNo, dob });
      return student;
    } catch (error) {
      throw error;
    }
  }

  async findStudentById(studentId) {
    try {
      const student = await Student.findById(studentId);
      return student;
    } catch (error) {
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    try {
      const student = await Student.findByIdAndUpdate(
        studentId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      return student;
    } catch (error) {
      throw error;
    }
  }

  async getAllStudents(filters = {}) {
    try {
      const students = await Student.find(filters).sort({ createdAt: -1 });
      return students;
    } catch (error) {
      throw error;
    }
  }

  // User operations
  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserByCoordinatorId(coordinatorId) {
    try {
      const user = await User.findOne({ coordinatorId });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async findUserByAdminId(adminId) {
    try {
      const user = await User.findOne({ adminId });
      return user;
    } catch (error) {
      throw error;
    }
  }

  async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // JWT operations
  generateToken(userId, role, additionalClaims = {}) {
    try {
      const payload = {
        userId,
        role,
        ...additionalClaims
      };
      return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
    } catch (error) {
      throw error;
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw error;
    }
  }

  // Resume Analysis operations
  async saveResumeAnalysis(analysisData) {
    try {
      const analysis = new ResumeAnalysis(analysisData);
      await analysis.save();
      return analysis;
    } catch (error) {
      throw error;
    }
  }

  async getResumeAnalysisByStudentId(studentId) {
    try {
      const analysis = await ResumeAnalysis.findOne({ studentId })
        .sort({ createdAt: -1 });
      return analysis;
    } catch (error) {
      throw error;
    }
  }

  async getAllResumeAnalyses(filters = {}) {
    try {
      const analyses = await ResumeAnalysis.find(filters)
        .populate('studentId', 'regNo firstName lastName department')
        .sort({ createdAt: -1 });
      return analyses;
    } catch (error) {
      throw error;
    }
  }

  // Statistics operations
  async getStudentStats() {
    try {
      const totalStudents = await Student.countDocuments();
      const studentsWithResumes = await Student.countDocuments({ resumeURL: { $ne: '' } });
      const studentsWithAnalysis = await ResumeAnalysis.distinct('studentId').length;
      
      const departmentStats = await Student.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            withResumes: {
              $sum: { $cond: [{ $ne: ['$resumeURL', ''] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        totalStudents,
        studentsWithResumes,
        studentsWithAnalysis,
        departmentStats
      };
    } catch (error) {
      throw error;
    }
  }

  // File operations
  async updateStudentResume(studentId, resumeData) {
    try {
      const student = await Student.findByIdAndUpdate(
        studentId,
        {
          resumeURL: resumeData.url,
          'resumeAnalysis.fileName': resumeData.fileName,
          'resumeAnalysis.fileSize': resumeData.fileSize,
          'resumeAnalysis.analysisResult': resumeData.analysisResult,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
      return student;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MongoDBService();
