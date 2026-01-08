import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { config } from '../config/config.js';

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  borrowedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'The librarian/editor who processed this loan'
  },
  borrowedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returnedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.ENUM('active', 'overdue', 'returned'),
    defaultValue: 'active',
    allowNull: false
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'loans',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    beforeCreate: (loan) => {
      // Set default due date if not provided
      if (!loan.dueDate) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + config.loan.defaultDays);
        loan.dueDate = dueDate;
      }

      // Set borrowed date if not provided
      if (!loan.borrowedAt) {
        loan.borrowedAt = new Date();
      }
    },
    beforeSave: (loan) => {
      // Update status based on dates
      const now = new Date();

      if (loan.returnedAt) {
        loan.status = 'returned';
      } else if (now > loan.dueDate) {
        loan.status = 'overdue';
      } else {
        loan.status = 'active';
      }
    }
  }
});

// Instance methods
Loan.prototype.isOverdue = function() {
  if (this.returnedAt) return false;
  return new Date() > this.dueDate;
};

Loan.prototype.daysUntilDue = function() {
  if (this.returnedAt) return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

Loan.prototype.isEligibleForReminder = function() {
  if (this.returnedAt || this.reminderSent) return false;

  const daysUntilDue = this.daysUntilDue();
  return daysUntilDue !== null && daysUntilDue <= config.loan.reminderDaysBefore;
};

Loan.prototype.markReturned = async function() {
  this.returnedAt = new Date();
  this.status = 'returned';
  await this.save();
  return this;
};

Loan.prototype.markReminderSent = async function() {
  this.reminderSent = true;
  await this.save();
  return this;
};

export default Loan;
