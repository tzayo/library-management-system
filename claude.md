# Claude.md - Library Management System

## Project Overview

This is a comprehensive digital library management system for a community children's library. The system enables families to browse and borrow books, librarians to manage loans and returns, and administrators to manage the entire system.

**Project Type:** Full-stack web application
**Primary Language:** Hebrew (UI), English (code/comments)
**License:** MIT

## Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Sequelize
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Email:** Nodemailer (Gmail SMTP)
- **Scheduled Tasks:** node-cron
- **Logging:** Winston, Morgan
- **Security:** Helmet.js, express-rate-limit, express-validator
- **Type:** ESM (ES Modules - `"type": "module"`)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Router:** React Router v6
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Icons:** Lucide React

### DevOps
- **Containerization:** Docker + Docker Compose
- **Database Container:** PostgreSQL 15

## Architecture

### User Roles & Permissions

1. **User (Regular)**
   - View book catalog
   - Search and filter books
   - View their current loans
   - View loan history
   - Update personal profile
   - Receive email reminders

2. **Editor (Librarian)**
   - All User permissions +
   - Register new loans (for any user)
   - Process book returns
   - View all active loans
   - View overdue loans
   - Add new books
   - Edit book details
   - View statistics dashboard

3. **Admin**
   - All Editor permissions +
   - Manage users (change roles, enable/disable, delete)
   - Delete books
   - System settings
   - Advanced reports and statistics

### Database Models

**User Model** (`backend/src/models/User.js`):
- id, name, email, password (hashed)
- role (User, Editor, Admin)
- phone, address
- active status
- timestamps (createdAt, updatedAt)

**Book Model** (`backend/src/models/Book.js`):
- id, title, author, isbn
- publisher, publicationYear
- category, language
- copiesTotal, copiesAvailable
- description, coverImage
- active status
- timestamps

**Loan Model** (`backend/src/models/Loan.js`):
- id, userId, bookId
- loanDate, dueDate, returnDate
- status (active, returned, overdue)
- reminderSent (boolean)
- notes
- timestamps

### API Structure

**Base URL:** `http://localhost:5000/api`

**Authentication Endpoints** (`/auth`):
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login (returns JWT)
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password

**Book Endpoints** (`/books`):
- `GET /books` - List all books (with filters)
- `GET /books/:id` - Get book details
- `POST /books` - Add book (Editor/Admin only)
- `PUT /books/:id` - Update book (Editor/Admin only)
- `DELETE /books/:id` - Delete book (Admin only)

**Loan Endpoints** (`/loans`):
- `GET /loans` - List all loans (Editor/Admin only)
- `GET /loans/my` - Get user's loans
- `POST /loans` - Create loan (Editor/Admin only)
- `PUT /loans/:id/return` - Return book (Editor/Admin only)

**User Endpoints** (`/users`):
- `GET /users` - List users (Admin only)
- `GET /users/:id` - Get user details (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

## Directory Structure

```
library-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # Database configuration
│   │   ├── models/
│   │   │   ├── index.js          # Model associations
│   │   │   ├── User.js
│   │   │   ├── Book.js
│   │   │   └── Loan.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── bookController.js
│   │   │   ├── loanController.js
│   │   │   └── userController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── books.js
│   │   │   ├── loans.js
│   │   │   └── users.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── errorHandler.js
│   │   │   └── validators.js
│   │   ├── services/
│   │   │   ├── emailService.js   # Email notifications
│   │   │   └── cronService.js    # Scheduled tasks
│   │   ├── utils/
│   │   │   ├── create-admin.js   # Admin creation script
│   │   │   ├── reset-admin.js    # Admin password reset
│   │   │   └── check-prerequisites.js
│   │   └── server.js             # Main entry point
│   ├── .env.example
│   ├── .env                      # Environment variables (gitignored)
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Main layout wrapper
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── books/
│   │   │   │   ├── BooksPage.jsx
│   │   │   │   ├── BookDetailsPage.jsx
│   │   │   │   ├── AddBookPage.jsx
│   │   │   │   ├── EditBookPage.jsx
│   │   │   │   └── ManageBooksPage.jsx
│   │   │   ├── loans/
│   │   │   │   ├── MyLoansPage.jsx
│   │   │   │   └── ManageLoansPage.jsx
│   │   │   ├── users/
│   │   │   │   ├── ManageUsersPage.jsx
│   │   │   │   └── UserDetailsPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Authentication state
│   │   ├── services/
│   │   │   └── api.js            # Axios configuration
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── .env.example
│   ├── .env                      # Environment variables (gitignored)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── docker-compose.yml            # Docker orchestration
├── .gitignore
├── README.md                     # Main documentation (Hebrew)
├── SETUP_GUIDE.md               # Setup instructions
├── DATABASE-GUIDE.md            # Database management
├── TROUBLESHOOTING.md           # Common issues
├── REINSTALL-GUIDE.md           # Clean reinstall guide
└── claude.md                    # This file
```

## Development Workflow

### Initial Setup

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd library-management-system
   ```

2. **Environment Configuration:**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with appropriate values

   # Frontend
   cd ../frontend
   cp .env.example .env
   ```

3. **Start with Docker (Recommended):**
   ```bash
   docker-compose up -d
   ```

4. **Create Admin User:**
   ```bash
   docker exec -it library_backend npm run create-admin -- --email=admin@library.com --password=Admin123! --name="Admin User"
   ```

### Development without Docker

**Backend:**
```bash
cd backend
npm install
npm run check          # Verify prerequisites
npm run dev            # Start development server
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev            # Start Vite dev server
```

### Common Tasks

**Check System Health:**
```bash
cd backend && npm run check
curl http://localhost:5000/health
```

**Create Admin User:**
```bash
# With Docker
docker exec -it library_backend npm run create-admin -- --email=EMAIL --password=PASS --name="NAME"

# Without Docker
cd backend
npm run create-admin -- --email=EMAIL --password=PASS --name="NAME"
```

**Reset Admin Password:**
```bash
cd backend
npm run reset-admin -- --email=admin@library.com --password=NewPass123!
```

**View Logs:**
```bash
# Docker
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

**Database Access:**
```bash
# With Docker
docker exec -it library_db psql -U library_user -d library_system

# List all users
SELECT id, name, email, role, active FROM "Users";

# List all books
SELECT id, title, author, "copiesAvailable", "copiesTotal" FROM "Books";
```

## Key Configuration Files

### Backend `.env`
```env
# Database
DB_HOST=db                    # Use 'localhost' for non-Docker
DB_PORT=5432
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=library_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email
EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM="Library System <your-email@gmail.com>"

# Server
PORT=5000
NODE_ENV=development
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000
```

## Authentication & Authorization

### JWT Token Flow

1. User logs in via `POST /api/auth/login`
2. Server validates credentials
3. Server generates JWT with user payload (id, email, role)
4. Client stores JWT (localStorage)
5. Client sends JWT in Authorization header: `Bearer <token>`
6. Middleware validates JWT on protected routes

### Middleware Chain

```javascript
// Example protected route
router.get('/loans',
  authenticateToken,              // Verify JWT
  authorize(['Editor', 'Admin']), // Check role
  loanController.getAllLoans
);
```

### Role-Based Access Control (RBAC)

- **Public Routes:** Login, Register, Health check
- **User Routes:** View books, own loans, profile
- **Editor Routes:** All User routes + manage loans, add/edit books
- **Admin Routes:** All Editor routes + manage users, delete books

## Email Notifications

### Automated Reminders

**Schedule:** Daily at 9:00 AM
**Recipients:** Users with books due in ≤7 days
**Frequency:** Once per loan

**Implementation:** `backend/src/services/cronService.js`

### Gmail Setup

1. Enable 2-factor authentication
2. Generate App Password
3. Add to `.env`:
   ```env
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASSWORD=app-password-16-chars
   ```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation (express-validator)
- SQL injection prevention (Sequelize ORM)
- XSS protection

## Testing Approach

### Manual Testing

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Login Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.com","password":"Admin123!"}'
```

**Authenticated Request:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Coding Standards

### General Guidelines

1. **ES Modules:** Use `import/export`, not `require`
2. **Async/Await:** Prefer over promises and callbacks
3. **Error Handling:** Always use try-catch in controllers
4. **Validation:** Validate all user inputs
5. **Comments:** Write clear comments for complex logic
6. **Naming:** Use descriptive variable/function names

### Backend Conventions

```javascript
// Controller pattern
export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

### Frontend Conventions

```jsx
// Component pattern
import { useState, useEffect } from 'react';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="container mx-auto">
      {/* Component JSX */}
    </div>
  );
};

export default BookList;
```

## Troubleshooting

### Common Issues

**Database Connection Error (`ENOTFOUND db`):**
- Using Docker: Ensure containers are running
- Without Docker: Change `DB_HOST=localhost` in `.env`

**Port Already in Use:**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

**Docker Issues:**
```bash
# Clean restart
docker-compose down
docker-compose up -d --build
```

**Frontend Not Connecting to Backend:**
- Verify `VITE_API_URL` in `frontend/.env`
- Check CORS settings in `backend/src/server.js`

## Deployment Considerations

### Production Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Update database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper email settings
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure database backups
- [ ] Update CORS allowed origins
- [ ] Review rate limiting settings
- [ ] Set secure cookie flags

### Environment Variables

Ensure all `.env` files are properly configured and never committed to git.

## Additional Resources

- **README.md** - Main documentation (Hebrew)
- **SETUP_GUIDE.md** - Detailed setup instructions
- **DATABASE-GUIDE.md** - Database operations and queries
- **TROUBLESHOOTING.md** - Common problems and solutions
- **REINSTALL-GUIDE.md** - Clean reinstall procedures

## Development Status

- ✅ Backend API - Complete
- ✅ Database Models - Complete
- ✅ Authentication - Complete
- ✅ Email Service - Complete
- ✅ Cron Jobs - Complete
- ✅ Frontend Structure - Complete
- ⏳ Frontend Pages - In Progress
- ⏳ Testing - Not Started

## Contributing Guidelines

When making changes:

1. **Read First:** Always read existing code before modifying
2. **Test Locally:** Verify changes work in development
3. **Follow Conventions:** Match existing code style
4. **Document:** Update relevant documentation
5. **Commit Messages:** Use clear, descriptive messages
6. **Security:** Never commit sensitive data (.env files)

## Contact & Support

For issues or questions, refer to the project documentation or create an issue in the repository.

---

**Built with ❤️ for the community**
