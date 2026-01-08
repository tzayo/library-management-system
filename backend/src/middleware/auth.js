import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { User } from '../models/index.js';

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'אין הרשאת גישה. נא להתחבר למערכת.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Find user
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'חשבון המשתמש אינו פעיל'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'טוקן לא תקין'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'טוקן פג תוקף. נא להתחבר מחדש.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'שגיאת שרת',
      error: error.message
    });
  }
};

// Check if user has required role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'נא להתחבר למערכת'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'אין לך הרשאה לבצע פעולה זו',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Middleware helpers for common role checks
export const isUser = authorize('user', 'editor', 'admin');
export const isEditor = authorize('editor', 'admin');
export const isAdmin = authorize('admin');
