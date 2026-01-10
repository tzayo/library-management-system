# Admin User Setup Guide

This guide explains how to manage admin users in the Library Management System.

## The Problem & Solution

### Issue
After creating an admin user, login might fail due to:
- Password not being properly hashed
- User not marked as active
- User not having admin role

### Solution
This system now includes:
1. **Auto-creation**: Admin user is automatically created on first startup
2. **Reset script**: Fix existing admin users with incorrect credentials
3. **Environment configuration**: Configure admin credentials via environment variables

---

## Methods to Create/Manage Admin Users

### Method 1: Automatic Creation (Recommended for Docker)

The system automatically creates a default admin user on first startup if no admin exists.

**Docker Compose Configuration:**

```yaml
environment:
  ADMIN_EMAIL: admin@library.com
  ADMIN_PASSWORD: Admin123!
  ADMIN_NAME: מנהל מערכת
```

**Default Credentials (if not configured):**
- Email: `admin@library.com`
- Password: `Admin123!`
- Name: `מנהל מערכת`

⚠️ **Security Warning**: Change these credentials immediately after first login!

### Method 2: Reset Existing Admin User

If you have an existing admin user that you can't login with, use the reset script:

**Inside Docker:**
```bash
docker exec -it library_backend npm run reset-admin -- --email=admin@library.com --password=NewSecurePass123!
```

**Local Development:**
```bash
npm run reset-admin -- --email=admin@library.com --password=NewSecurePass123!
```

**Parameters:**
- `--email`: Email of the admin user (default: admin@library.com)
- `--password`: New password (required, min 8 chars with at least 1 digit)

### Method 3: Create New Admin User

To create a completely new admin user:

**Inside Docker:**
```bash
docker exec -it library_backend npm run create-admin -- --email=admin@example.com --password=SecurePass123! --name="Admin Name"
```

**Local Development:**
```bash
npm run create-admin -- --email=admin@example.com --password=SecurePass123! --name="Admin Name"
```

**Parameters:**
- `--email`: Email address (required)
- `--password`: Password (required, min 8 chars with at least 1 digit)
- `--name`: Full name (optional, default: "מנהל מערכת")
- `--phone`: Phone number (optional)

---

## Authentication Logic

### Password Hashing
- Passwords are automatically hashed using bcrypt with cost factor 12
- Hashing occurs in the `beforeCreate` and `beforeUpdate` hooks in the User model
- Never store plain-text passwords

### Login Process
1. User submits email and password
2. System finds user by email
3. System checks if user is active (`isActive: true`)
4. System compares submitted password with hashed password using `bcrypt.compare()`
5. If valid, system generates JWT token

### Password Comparison
```javascript
// In User model (src/models/User.js)
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

---

## Troubleshooting

### Cannot Login After Creating Admin

**Symptom**: Created admin user but login fails with "Invalid email or password"

**Solutions:**

1. **Reset the password** using the reset script:
   ```bash
   docker exec -it library_backend npm run reset-admin -- --password=NewPass123!
   ```

2. **Check if user is active** (via database):
   ```sql
   UPDATE users SET "isActive" = true WHERE email = 'admin@library.com';
   ```

3. **Verify admin role** (via database):
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@library.com';
   ```

### User Already Exists Error

**Symptom**: `❌ User with email "admin@library.com" already exists`

**Solution**: Use the reset script instead:
```bash
docker exec -it library_backend npm run reset-admin -- --password=NewPass123!
```

### Port Already in Use (EADDRINUSE)

**Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or restart the server
docker-compose restart backend
```

---

## Environment Variables

Add these to your `.env` file or docker-compose.yml:

```env
# Default Admin User Configuration
ADMIN_EMAIL=admin@library.com
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=מנהל מערכת
```

---

## Best Practices

1. ✅ **Change default credentials** immediately after deployment
2. ✅ **Use strong passwords** (min 8 chars, include numbers)
3. ✅ **Use environment variables** for configuration
4. ✅ **Keep credentials secure** - never commit to git
5. ✅ **Use reset script** if you forget the password
6. ❌ **Never use default credentials** in production
7. ❌ **Never store passwords** in plain text

---

## Quick Reference

| Task | Command |
|------|---------|
| Auto-create admin on startup | Automatic (requires env vars) |
| Create new admin | `npm run create-admin -- --email=X --password=Y` |
| Reset admin password | `npm run reset-admin -- --password=NewPass` |
| Check admin exists | SQL: `SELECT * FROM users WHERE role='admin';` |
| Make user admin | SQL: `UPDATE users SET role='admin' WHERE email='X';` |

---

## Support

If you continue to have issues:
1. Check backend logs: `docker logs library_backend`
2. Verify database connection
3. Ensure User model hooks are working
4. Check that bcrypt is installed: `npm list bcryptjs`
