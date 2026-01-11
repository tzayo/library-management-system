# 📚 מערכת ניהול ספרייה קהילתית

מערכת דיגיטלית מקיפה לניהול ספריית ילדים בקיבוץ, המאפשרת למשפחות לצפות ולשאול ספרים, לספרנים לנהל השאלות והחזרות, ולמנהלים לנהל את כל המערכת.

## 🎯 תכונות עיקריות

### למשתמשים רגילים (User)
- ✅ צפייה בקטלוג הספרים המלא
- 🔍 חיפוש וסינון ספרים (לפי שם, סופר, קטגוריה, זמינות)
- 📊 צפייה בספרים שהם שאלו כרגע
- 📜 היסטוריית השאלות אישית
- 👤 עדכון פרטים אישיים
- 📧 תזכורות אוטומטיות להחזרת ספרים

### לספרנים (Editor)
- כל היכולות של משתמש רגיל +
- ✏️ רישום השאלה חדשה (עבור כל משתמש)
- ↩️ רישום החזרת ספר
- 📋 צפייה בכל ההשאלות הפעילות במערכת
- ⚠️ צפייה בהשאלות באיחור
- ➕ הוספת ספר חדש למערכת
- ✏️ עריכת פרטי ספר
- 📊 דשבורד עם סטטיסטיקות

### למנהלים (Admin)
- כל היכולות של ספרן +
- 👥 ניהול משתמשים (שינוי הרשאות, השבתה/הפעלה, מחיקה)
- 🗑️ מחיקת ספרים
- ⚙️ הגדרות מערכת
- 📈 דוחות מתקדמים וסטטיסטיקות

## 🛠 טכנולוגיות

### Backend
- Node.js + Express.js
- PostgreSQL 15
- Sequelize ORM
- JWT Authentication
- Nodemailer (תזכורות במייל)
- Node-cron (משימות מתוזמנות)
- Bcrypt (הצפנת סיסמאות)

### Frontend
- React 18
- Vite
- React Router v6
- Tailwind CSS
- Axios
- Lucide React (אייקונים)

### DevOps
- Docker + Docker Compose
- PostgreSQL (Database)

## 📚 Documentation

- 🚀 [**Installation Guide**](INSTALL.md) - **START HERE!** Complete step-by-step deployment guide
- 🧪 [Deployment Testing Guide](DEPLOYMENT-TEST.md) - Verify your installation is working correctly
- 📖 [Complete Reinstall Guide](REINSTALL-GUIDE.md) - Clean install and reset procedures
- 🗄️ [Database Guide](DATABASE-GUIDE.md) - Database inspection, backup, and management
- 🔧 [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions

## 📋 דרישות מקדימות

- Node.js 20+
- Docker + Docker Compose
- Git

## 🚀 התקנה והרצה

> **💡 טיפ:** לפני שמתחילים, אפשר להריץ בדיקת תקינות:
> ```bash
> cd backend && npm install && npm run check
> ```
> זה יבדוק שכל הדרישות מקדימות מסודרות ויציע פתרונות אם יש בעיות.

### שיטה 1: Docker (מומלץ)

1. **Clone הפרויקט:**
```bash
git clone <repository-url>
cd library-management-system
```

2. **יצירת קבצי .env:**

Backend (.env):
```bash
cd backend
cp .env.example .env
```

ערוך את `backend/.env` והזן את הערכים המתאימים:
```env
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=library_password

# JWT Secret (צור סוד חזק!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email (Gmail SMTP)
EMAIL_ENABLED=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

Frontend (.env):
```bash
cd ../frontend
cp .env.example .env
```

3. **הרצת המערכת:**
```bash
cd ..
docker-compose up -d
```

4. **יצירת משתמש Admin ראשון:**
```bash
docker exec -it library_backend npm run create-admin -- --email=admin@library.com --password=Admin123! --name="מנהל מערכת"
```

5. **גישה למערכת:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### שיטה 2: ללא Docker (פיתוח)

**חשוב:** שיטה זו דורשת PostgreSQL מותקן ורץ על המחשב המקומי.

#### Backend

1. **התקנת PostgreSQL והגדרת Database:**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql
   sudo systemctl start postgresql

   # macOS
   brew install postgresql@15
   brew services start postgresql@15

   # יצירת Database ומשתמש
   sudo -u postgres psql
   CREATE DATABASE library_system;
   CREATE USER library_user WITH PASSWORD 'library_password';
   GRANT ALL PRIVILEGES ON DATABASE library_system TO library_user;
   \q
   ```

2. **התקנת dependencies והרצה:**
```bash
cd backend
npm install
cp .env.example .env
# ערוך את .env - וודא ש-DB_HOST=localhost
nano .env  # או כל עורך טקסט

# בדוק שהכל תקין
npm run check

# הרץ את השרת
npm run dev
```

3. **יצירת Admin:**
```bash
npm run create-admin -- --email=admin@library.com --password=Admin123! --name="מנהל מערכת"
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📧 הגדרת Gmail לתזכורות

1. היכנס ל-Google Account
2. אבטחה → אימות דו-שלבי (הפעל אם לא פעיל)
3. אבטחה → App Passwords
4. בחר "Mail" ו-"Other device"
5. העתק את הסיסמה בת 16 התווים
6. הזן ב-`backend/.env`:
```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

## 📁 מבנה הפרויקט

```
library-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # קבצי קונפיגורציה
│   │   ├── models/          # מודלים (User, Book, Loan)
│   │   ├── controllers/     # בקרים (logic)
│   │   ├── routes/          # נתיבי API
│   │   ├── middleware/      # middleware (auth, validator)
│   │   ├── services/        # שירותים (email, cron)
│   │   ├── utils/           # כלים (create-admin)
│   │   └── server.js        # קובץ ראשי
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # קומפוננטות
│   │   ├── pages/           # דפים
│   │   ├── contexts/        # Context (Auth)
│   │   ├── services/        # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - רישום משתמש חדש
- `POST /api/auth/login` - התחברות
- `GET /api/auth/me` - פרטי המשתמש המחובר
- `PUT /api/auth/profile` - עדכון פרופיל
- `PUT /api/auth/change-password` - שינוי סיסמה

### Books
- `GET /api/books` - רשימת ספרים
- `GET /api/books/:id` - פרטי ספר
- `POST /api/books` - הוספת ספר (Editor/Admin)
- `PUT /api/books/:id` - עדכון ספר (Editor/Admin)
- `DELETE /api/books/:id` - מחיקת ספר (Admin)

### Loans
- `GET /api/loans` - רשימת כל ההשאלות (Editor/Admin)
- `GET /api/loans/my` - ההשאלות שלי (User)
- `POST /api/loans` - יצירת השאלה (Editor/Admin)
- `PUT /api/loans/:id/return` - החזרת ספר (Editor/Admin)

### Users
- `GET /api/users` - רשימת משתמשים (Admin)
- `PUT /api/users/:id` - עדכון משתמש (Admin)
- `DELETE /api/users/:id` - מחיקת משתמש (Admin)

## ⏰ תזכורות אוטומטיות

המערכת שולחת תזכורות אוטומטיות במייל:
- 🕐 **מתי:** כל יום ב-9:00 בבוקר
- 📧 **למי:** משתמשים עם ספרים שיש להחזיר בעוד 7 ימים או פחות
- 🔄 **תדירות:** פעם אחת בלבד לכל השאלה

## 🔧 פתרון בעיות

אם נתקלת בבעיות, ראה את [מדריך פתרון הבעיות](TROUBLESHOOTING.md) המפורט.

### בעיות נפוצות

#### שגיאה: `getaddrinfo ENOTFOUND db`

המערכת מנסה להתחבר לכתובת "db" שקיימת רק ב-Docker.

**פתרון מהיר:**
```bash
# אופציה 1: השתמש ב-Docker
docker-compose up -d

# אופציה 2: תקן את הקונפיגורציה
cd backend
nano .env  # שנה DB_HOST=localhost
```

#### שגיאה: `ECONNREFUSED`

PostgreSQL לא רץ או לא נגיש.

**פתרון:**
```bash
# בדוק אם PostgreSQL רץ
nc -zv localhost 5432

# אם לא רץ, התחל אותו
sudo service postgresql start  # Ubuntu/Debian
brew services start postgresql # macOS

# או השתמש ב-Docker
docker-compose up -d
```

לפרטים נוספים ופתרונות לבעיות נוספות, ראה [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 📝 פקודות שימושיות

### כלליות
```bash
# בדיקת תקינות מערכת
cd backend && npm run check

# בדיקת חיבוריות מקיפה
./check-connectivity.sh
```

### Docker
```bash
# הפעלת המערכת
docker-compose up -d

# כיבוי המערכת
docker-compose down

# צפייה בלוגים
docker-compose logs -f

# בנייה מחדש
docker-compose up -d --build
```

### Backend
```bash
# בדיקת תקינות מערכת
npm run check

# יצירת Admin
npm run create-admin -- --email=admin@example.com --password=Pass123! --name="Admin"

# הרצה בmode פיתוח
npm run dev

# הרצה בmode production
npm start
```

### Frontend
```bash
# הרצה בmode פיתוח
npm run dev

# בנייה לproduction
npm run build
```

## 🔒 אבטחה

- ✅ הצפנת סיסמאות עם bcrypt
- ✅ JWT tokens לאימות
- ✅ Rate limiting (100 בקשות ל-15 דקות)
- ✅ Helmet.js לאבטחת headers
- ✅ CORS מוגדר נכון
- ✅ Input validation על כל שדה
- ✅ הגנה מפני SQL Injection
- ✅ הגנה מפני XSS

## 📊 סטטוס פיתוח

- ✅ Backend API - **הושלם**
- ✅ Database Models - **הושלם**
- ✅ Authentication - **הושלם**
- ✅ Email Service - **הושלם**
- ✅ Cron Jobs - **הושלם**
- ✅ Frontend Structure - **הושלם**
- ⏳ Frontend Pages - **בתהליך**
- ⏳ Testing - **לא התחיל**

## 📄 רישיון

MIT License

---

**נבנה בעברית, עם ❤️ לקהילה**
