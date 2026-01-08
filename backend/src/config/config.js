import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Email
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'Library System <noreply@library.com>'
  },

  // Loan settings
  loan: {
    defaultDays: parseInt(process.env.DEFAULT_LOAN_DAYS) || 21,
    reminderDaysBefore: parseInt(process.env.REMINDER_DAYS_BEFORE) || 7,
    reminderCronSchedule: process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *' // 9 AM daily
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // WhatsApp (optional)
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    apiUrl: process.env.WHATSAPP_API_URL,
    apiKey: process.env.WHATSAPP_API_KEY
  }
};

export default config;
