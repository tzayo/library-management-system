import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { User } from '../models/index.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '\u200Fמשתמש עם אימייל זה כבר קיים במערכת\u200F'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      fullName,
      phone: phone || null,
      role: 'user' // Default role
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: '\u200Fמשתמש נרשם בהצלחה\u200F',
      data: {
        token,
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '\u200Fשגיאה ברישום משתמש\u200F',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '\u200Fאימייל או סיסמה שגויים\u200F'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '\u200Fחשבון המשתמש אינו פעיל. נא לפנות למנהל המערכת.\u200F'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '\u200Fאימייל או סיסמה שגויים\u200F'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: '\u200Fהתחברת בהצלחה\u200F',
      data: {
        token,
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '\u200Fשגיאה בהתחברות\u200F',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '\u200Fמשתמש לא נמצא\u200F'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '\u200Fשגיאה בטעינת פרטי משתמש\u200F',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '\u200Fמשתמש לא נמצא\u200F'
      });
    }

    // Update allowed fields
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: '\u200Fפרטי המשתמש עודכנו בהצלחה\u200F',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '\u200Fשגיאה בעדכון פרטי משתמש\u200F',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '\u200Fמשתמש לא נמצא\u200F'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '\u200Fהסיסמה הנוכחית שגויה\u200F'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: '\u200Fהסיסמה שונתה בהצלחה\u200F'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '\u200Fשגיאה בשינוי סיסמה\u200F',
      error: error.message
    });
  }
};
