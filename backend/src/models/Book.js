import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '\u200Fכותרת הספר היא שדה חובה\u200F'
      }
    }
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isbn: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: /^(?:\d{10}|\d{13})?$/,
        msg: 'ISBN לא תקין (צריך להיות 10 או 13 ספרות)'
      }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '\u200Fכללי\u200F'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: {
        msg: '\u200Fכתובת התמונה חייבת להיות URL תקין\u200F'
      }
    }
  },
  quantityTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: 0,
        msg: '\u200Fכמות כוללת לא יכולה להיות שלילית\u200F'
      },
      isInt: {
        msg: '\u200Fכמות כוללת חייבת להיות מספר שלם\u200F'
      }
    }
  },
  quantityAvailable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: 0,
        msg: '\u200Fכמות זמינה לא יכולה להיות שלילית\u200F'
      },
      isInt: {
        msg: '\u200Fכמות זמינה חייבת להיות מספר שלם\u200F'
      }
    }
  },
  addedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    beforeCreate: (book) => {
      // When creating a book, available quantity equals total quantity
      if (book.quantityAvailable === undefined) {
        book.quantityAvailable = book.quantityTotal;
      }
    }
  }
});

// Instance methods
Book.prototype.isAvailable = function() {
  return this.quantityAvailable > 0;
};

Book.prototype.addCopies = async function(quantity) {
  this.quantityTotal += quantity;
  this.quantityAvailable += quantity;
  await this.save();
  return this;
};

Book.prototype.borrowCopy = async function() {
  if (this.quantityAvailable <= 0) {
    throw new Error('\u200Fאין עותקים זמינים של ספר זה\u200F');
  }
  this.quantityAvailable -= 1;
  await this.save();
  return this;
};

Book.prototype.returnCopy = async function() {
  if (this.quantityAvailable >= this.quantityTotal) {
    throw new Error('\u200Fכל העותקים כבר זמינים\u200F');
  }
  this.quantityAvailable += 1;
  await this.save();
  return this;
};

export default Book;
