import { Op } from 'sequelize';
import { Book, User, Loan } from '../models/index.js';

// @desc    Get all books with filters and pagination
// @route   GET /api/books
// @access  Private
export const getAllBooks = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      available = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build where clause
    const where = {};

    // Search by title or author
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by availability
    if (available === 'true') {
      where.quantityAvailable = { [Op.gt]: 0 };
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch books
    const { count, rows: books } = await Book.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת רשימת הספרים',
      error: error.message
    });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Private
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id, {
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Loan,
          as: 'loans',
          limit: 10,
          order: [['borrowedAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName']
            }
          ]
        }
      ]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'ספר לא נמצא'
      });
    }

    res.status(200).json({
      success: true,
      data: { book }
    });
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת פרטי הספר',
      error: error.message
    });
  }
};

// @desc    Get all categories
// @route   GET /api/books/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Book.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(c => c !== null && c !== '');

    res.status(200).json({
      success: true,
      data: { categories: categoryList }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת רשימת הקטגוריות',
      error: error.message
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private (Editor/Admin)
export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      quantityTotal
    } = req.body;

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const existingBook = await Book.findOne({ where: { isbn } });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'ספר עם ISBN זה כבר קיים במערכת'
        });
      }
    }

    // Create book
    const book = await Book.create({
      title,
      author,
      isbn,
      category: category || 'כללי',
      description,
      coverImage,
      quantityTotal: quantityTotal || 1,
      quantityAvailable: quantityTotal || 1,
      addedById: req.user.id
    });

    // Fetch book with relations
    const createdBook = await Book.findByPk(book.id, {
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'הספר נוסף בהצלחה',
      data: { book: createdBook }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהוספת ספר',
      error: error.message
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Editor/Admin)
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      isbn,
      category,
      description,
      coverImage,
      quantityTotal
    } = req.body;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'ספר לא נמצא'
      });
    }

    // Check if ISBN is being changed and if it already exists
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ where: { isbn } });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'ספר עם ISBN זה כבר קיים במערכת'
        });
      }
    }

    // Calculate new available quantity if total is changing
    let newQuantityAvailable = book.quantityAvailable;
    if (quantityTotal !== undefined && quantityTotal !== book.quantityTotal) {
      const difference = quantityTotal - book.quantityTotal;
      newQuantityAvailable = book.quantityAvailable + difference;

      // Ensure available quantity doesn't go negative
      if (newQuantityAvailable < 0) {
        return res.status(400).json({
          success: false,
          message: 'לא ניתן להפחית את הכמות מתחת למספר העותקים המושאלים'
        });
      }
    }

    // Update book
    await book.update({
      title: title !== undefined ? title : book.title,
      author: author !== undefined ? author : book.author,
      isbn: isbn !== undefined ? isbn : book.isbn,
      category: category !== undefined ? category : book.category,
      description: description !== undefined ? description : book.description,
      coverImage: coverImage !== undefined ? coverImage : book.coverImage,
      quantityTotal: quantityTotal !== undefined ? quantityTotal : book.quantityTotal,
      quantityAvailable: newQuantityAvailable
    });

    // Fetch updated book with relations
    const updatedBook = await Book.findByPk(id, {
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'הספר עודכן בהצלחה',
      data: { book: updatedBook }
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון ספר',
      error: error.message
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'ספר לא נמצא'
      });
    }

    // Check if there are active loans for this book
    const activeLoans = await Loan.count({
      where: {
        bookId: id,
        returnedAt: null
      }
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'לא ניתן למחוק ספר עם השאלות פעילות'
      });
    }

    await book.destroy();

    res.status(200).json({
      success: true,
      message: 'הספר נמחק בהצלחה'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה במחיקת ספר',
      error: error.message
    });
  }
};

// @desc    Add copies to book
// @route   POST /api/books/:id/add-copies
// @access  Private (Editor/Admin)
export const addCopiesToBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'כמות לא תקינה'
      });
    }

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'ספר לא נמצא'
      });
    }

    await book.addCopies(parseInt(quantity));

    res.status(200).json({
      success: true,
      message: `נוספו ${quantity} עותקים בהצלחה`,
      data: { book }
    });
  } catch (error) {
    console.error('Add copies error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בהוספת עותקים',
      error: error.message
    });
  }
};
