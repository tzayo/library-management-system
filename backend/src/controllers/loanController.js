import { Op } from 'sequelize';
import { Loan, Book, User } from '../models/index.js';
import sequelize from '../config/database.js';

// @desc    Get all loans with filters
// @route   GET /api/loans
// @access  Private (Editor/Admin)
export const getAllLoans = async (req, res) => {
  try {
    const {
      status = '',
      userId = '',
      bookId = '',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch loans
    const { count, rows: loans } = await Loan.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['borrowedAt', 'DESC']],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: User,
          as: 'borrowedBy',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        loans,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת רשימת ההשאלות',
      error: error.message
    });
  }
};

// @desc    Get user's own loans
// @route   GET /api/loans/my
// @access  Private (User)
export const getMyLoans = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 20 } = req.query;

    const where = { userId: req.user.id };

    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: loans } = await Loan.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['borrowedAt', 'DESC']],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage', 'category']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        loans,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my loans error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת ההשאלות שלך',
      error: error.message
    });
  }
};

// @desc    Get overdue loans
// @route   GET /api/loans/overdue
// @access  Private (Editor/Admin)
export const getOverdueLoans = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: {
        returnedAt: null,
        dueDate: { [Op.lt]: new Date() }
      },
      order: [['dueDate', 'ASC']],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        loans,
        count: loans.length
      }
    });
  } catch (error) {
    console.error('Get overdue loans error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת השאלות באיחור',
      error: error.message
    });
  }
};

// @desc    Get loan statistics
// @route   GET /api/loans/stats
// @access  Private (Editor/Admin)
export const getLoanStats = async (req, res) => {
  try {
    const activeLoans = await Loan.count({
      where: { status: 'active' }
    });

    const overdueLoans = await Loan.count({
      where: { status: 'overdue' }
    });

    const returnedLoans = await Loan.count({
      where: { status: 'returned' }
    });

    const totalLoans = await Loan.count();

    // Most borrowed books
    const popularBooks = await Loan.findAll({
      attributes: [
        'bookId',
        [sequelize.fn('COUNT', sequelize.col('Loan.id')), 'loanCount']
      ],
      group: ['bookId', 'book.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('Loan.id')), 'DESC']],
      limit: 10,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          active: activeLoans,
          overdue: overdueLoans,
          returned: returnedLoans,
          total: totalLoans
        },
        popularBooks
      }
    });
  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת סטטיסטיקות',
      error: error.message
    });
  }
};

// @desc    Create new loan (borrow a book)
// @route   POST /api/loans
// @access  Private (Editor/Admin)
export const createLoan = async (req, res) => {
  try {
    const { bookId, userId, dueDate } = req.body;

    // Check if book exists and is available
    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'ספר לא נמצא'
      });
    }

    if (!book.isAvailable()) {
      return res.status(400).json({
        success: false,
        message: 'אין עותקים זמינים של ספר זה'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'משתמש זה אינו פעיל'
      });
    }

    // Check if user already has an active loan for this book
    const existingLoan = await Loan.findOne({
      where: {
        bookId,
        userId,
        returnedAt: null
      }
    });

    if (existingLoan) {
      return res.status(400).json({
        success: false,
        message: 'משתמש זה כבר שאל את הספר הזה'
      });
    }

    // Create loan
    const loan = await Loan.create({
      bookId,
      userId,
      borrowedById: req.user.id,
      dueDate: dueDate || undefined // Will use default from model if not provided
    });

    // Decrease available quantity
    await book.borrowCopy();

    // Fetch created loan with relations
    const createdLoan = await Loan.findByPk(loan.id, {
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'borrowedBy',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'השאלה נרשמה בהצלחה',
      data: { loan: createdLoan }
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה ברישום השאלה',
      error: error.message
    });
  }
};

// @desc    Return a book
// @route   PUT /api/loans/:id/return
// @access  Private (Editor/Admin)
export const returnLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [
        {
          model: Book,
          as: 'book'
        }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'השאלה לא נמצאה'
      });
    }

    if (loan.returnedAt) {
      return res.status(400).json({
        success: false,
        message: 'ספר זה כבר הוחזר'
      });
    }

    // Mark loan as returned
    await loan.markReturned();

    // Increase available quantity
    await loan.book.returnCopy();

    // Fetch updated loan with relations
    const updatedLoan = await Loan.findByPk(id, {
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'הספר הוחזר בהצלחה',
      data: { loan: updatedLoan }
    });
  } catch (error) {
    console.error('Return loan error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהחזרת ספר',
      error: error.message
    });
  }
};

// @desc    Get single loan by ID
// @route   GET /api/loans/:id
// @access  Private
export const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: User,
          as: 'borrowedBy',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'השאלה לא נמצאה'
      });
    }

    // If user is regular user, only allow viewing their own loans
    if (req.user.role === 'user' && loan.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'אין לך הרשאה לצפות בהשאלה זו'
      });
    }

    res.status(200).json({
      success: true,
      data: { loan }
    });
  } catch (error) {
    console.error('Get loan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת פרטי ההשאלה',
      error: error.message
    });
  }
};
