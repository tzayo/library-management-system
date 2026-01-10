import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

// Create transporter
let transporter = null;

const createTransporter = () => {
  if (!config.email.enabled) {
    console.log('📧 Email service is disabled');
    return null;
  }

  if (!config.email.user || !config.email.password) {
    console.warn('⚠️  Email credentials not configured');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating email transporter:', error.message);
    return null;
  }
};

// Initialize transporter
createTransporter();

// Send email helper
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!transporter) {
      console.log('Email not sent - transporter not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email templates

export const sendWelcomeEmail = async (user) => {
  const subject = '\u200Fברוכים הבאים לספריית הקיבוץ\u200F';

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 ברוכים הבאים לספריית הקיבוץ</h1>
        </div>
        <div class="content">
          <h2>שלום ${user.fullName},</h2>
          <p>אנחנו שמחים שהצטרפת למערכת ניהול ספריית הקיבוץ!</p>
          <p>כעת תוכל:</p>
          <ul>
            <li>לצפות בקטלוג הספרים המלא</li>
            <li>לחפש ספרים לפי שם, סופר או קטגוריה</li>
            <li>לבדוק זמינות ספרים</li>
            <li>לעקוב אחר ההשאלות שלך</li>
          </ul>
          <p>על מנת לשאול ספרים, פנה לספרן/ית במהלך שעות פתיחת הספרייה.</p>
          <div style="text-align: center;">
            <a href="${config.frontendUrl}/login" class="button">כניסה למערכת</a>
          </div>
        </div>
        <div class="footer">
          <p>מערכת ניהול ספריית הקיבוץ</p>
          <p>אימייל זה נשלח אוטומטית, אין להשיב.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
שלום ${user.fullName},

אנחנו שמחים שהצטרפת למערכת ניהול ספריית הקיבוץ!

כעת תוכל:
- לצפות בקטלוג הספרים המלא
- לחפש ספרים לפי שם, סופר או קטגוריה
- לבדוק זמינות ספרים
- לעקוב אחר ההשאלות שלך

על מנת לשאול ספרים, פנה לספרן/ית במהלך שעות פתיחת הספרייה.

מערכת ניהול ספריית הקיבוץ
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export const sendLoanReminderEmail = async (loan, user, book) => {
  const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;

  const subject = isOverdue
    ? `⏰ איחור בהחזרת ספר - ${book.title}`
    : `תזכורת: החזרת ספר "${book.title}"`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${isOverdue ? '#E74C3C' : '#F39C12'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-right: 4px solid #4A90E2; }
        .warning { color: #E74C3C; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isOverdue ? '⏰ איחור בהחזרת ספר' : '📚 תזכורת להחזרת ספר'}</h1>
        </div>
        <div class="content">
          <h2>שלום ${user.fullName},</h2>
          ${isOverdue
            ? `<p class="warning">הספר שלהלן היה אמור להיות מוחזר לפני ${Math.abs(daysUntilDue)} ימים.</p>`
            : `<p>זוהי תזכורת שיש להחזיר את הספר שלהלן בעוד ${daysUntilDue} ימים.</p>`
          }

          <div class="book-info">
            <h3>📖 פרטי הספר:</h3>
            <p><strong>כותרת:</strong> ${book.title}</p>
            ${book.author ? `<p><strong>סופר/ת:</strong> ${book.author}</p>` : ''}
            <p><strong>תאריך השאלה:</strong> ${new Date(loan.borrowedAt).toLocaleDateString('he-IL')}</p>
            <p><strong>תאריך החזרה מתוכנן:</strong> ${new Date(loan.dueDate).toLocaleDateString('he-IL')}</p>
          </div>

          <p>נא להחזיר את הספר לספרייה בהקדם האפשרי במהלך שעות הפתיחה.</p>
          <p>תודה רבה!</p>
        </div>
        <div class="footer">
          <p>מערכת ניהול ספריית הקיבוץ</p>
          <p>אימייל זה נשלח אוטומטית, אין להשיב.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
שלום ${user.fullName},

${isOverdue
  ? `הספר "${book.title}" היה אמור להיות מוחזר לפני ${Math.abs(daysUntilDue)} ימים.`
  : `זוהי תזכורת שיש להחזיר את הספר "${book.title}" בעוד ${daysUntilDue} ימים.`
}

פרטי הספר:
- כותרת: ${book.title}
${book.author ? `- סופר/ת: ${book.author}` : ''}
- תאריך השאלה: ${new Date(loan.borrowedAt).toLocaleDateString('he-IL')}
- תאריך החזרה מתוכנן: ${new Date(loan.dueDate).toLocaleDateString('he-IL')}

נא להחזיר את הספר לספרייה בהקדם האפשרי.

תודה רבה!
מערכת ניהול ספריית הקיבוץ
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export const sendBatchReminderEmail = async (user, loans) => {
  const subject = `\u200Fתזכורת: החזרת ${loans.length} ספרים\u200F`;

  const booksListHtml = loans.map(loan => `
    <li>
      <strong>${loan.book.title}</strong>
      ${loan.book.author ? `- ${loan.book.author}` : ''}
      (החזרה עד: ${new Date(loan.dueDate).toLocaleDateString('he-IL')})
    </li>
  `).join('');

  const booksListText = loans.map(loan =>
    `- ${loan.book.title}${loan.book.author ? ` - ${loan.book.author}` : ''} (החזרה עד: ${new Date(loan.dueDate).toLocaleDateString('he-IL')})`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .books-list { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 תזכורת להחזרת ספרים</h1>
        </div>
        <div class="content">
          <h2>שלום ${user.fullName},</h2>
          <p>יש לך ${loans.length} ספרים שיש להחזיר בקרוב:</p>

          <div class="books-list">
            <ul>
              ${booksListHtml}
            </ul>
          </div>

          <p>נא להחזיר את הספרים לספרייה במהלך שעות הפתיחה.</p>
          <p>תודה רבה!</p>
        </div>
        <div class="footer">
          <p>מערכת ניהול ספריית הקיבוץ</p>
          <p>אימייל זה נשלח אוטומטית, אין להשיב.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
שלום ${user.fullName},

יש לך ${loans.length} ספרים שיש להחזיר בקרוב:

${booksListText}

נא להחזיר את הספרים לספרייה במהלך שעות הפתיחה.

תודה רבה!
מערכת ניהול ספריית הקיבוץ
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    if (!transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    await transporter.verify();
    console.log('✅ Email connection test successful');
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    console.error('❌ Email connection test failed:', error.message);
    return { success: false, message: error.message };
  }
};

export default {
  sendWelcomeEmail,
  sendLoanReminderEmail,
  sendBatchReminderEmail,
  testEmailConnection
};
