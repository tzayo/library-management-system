import User from './User.js';
import Book from './Book.js';
import Loan from './Loan.js';

// Define associations

// User -> Book (who added the book)
User.hasMany(Book, {
  foreignKey: 'addedById',
  as: 'addedBooks',
  onDelete: 'RESTRICT'
});

Book.belongsTo(User, {
  foreignKey: 'addedById',
  as: 'addedBy'
});

// User -> Loan (who borrowed the book)
User.hasMany(Loan, {
  foreignKey: 'userId',
  as: 'loans',
  onDelete: 'RESTRICT'
});

Loan.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User -> Loan (who processed the loan - librarian/editor)
User.hasMany(Loan, {
  foreignKey: 'borrowedById',
  as: 'processedLoans',
  onDelete: 'RESTRICT'
});

Loan.belongsTo(User, {
  foreignKey: 'borrowedById',
  as: 'borrowedBy'
});

// Book -> Loan
Book.hasMany(Loan, {
  foreignKey: 'bookId',
  as: 'loans',
  onDelete: 'RESTRICT'
});

Loan.belongsTo(Book, {
  foreignKey: 'bookId',
  as: 'book'
});

export { User, Book, Loan };
