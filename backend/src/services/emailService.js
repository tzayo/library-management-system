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
  const subject = 'Welcome to the Library';

  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
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
          <h1>📚 Welcome to the Library</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.fullName},</h2>
          <p>We're happy you've joined the Library Management System!</p>
          <p>You can now:</p>
          <ul>
            <li>View the complete book catalog</li>
            <li>Search books by name, author, or category</li>
            <li>Check book availability</li>
            <li>Track your loans</li>
          </ul>
          <p>To borrow books, please contact the librarian during library opening hours.</p>
          <div style="text-align: center;">
            <a href="${config.frontendUrl}/login" class="button">Login to System</a>
          </div>
        </div>
        <div class="footer">
          <p>Library Management System</p>
          <p>This email was sent automatically, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${user.fullName},

We're happy you've joined the Library Management System!

You can now:
- View the complete book catalog
- Search books by name, author, or category
- Check book availability
- Track your loans

To borrow books, please contact the librarian during library opening hours.

Library Management System
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
    ? `⏰ Book Return Overdue - \${book.title}`
    : `Reminder: Return Book "\${book.title}"`;

  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${isOverdue ? '#E74C3C' : '#F39C12'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4A90E2; }
        .warning { color: #E74C3C; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isOverdue ? '⏰ Book Return Overdue' : '📚 Book Return Reminder'}</h1>
        </div>
        <div class="content">
          <h2>Hello \${user.fullName},</h2>
          ${isOverdue
            ? `<p class="warning">The book below was due ${Math.abs(daysUntilDue)} days ago.</p>`
            : `<p>This is a reminder that you need to return the book below in ${daysUntilDue} days ago.</p>`
          }

          <div class="book-info">
            <h3>📖 Book Details:</h3>
            <p><strong>Title:</strong> ${book.title}</p>
            ${book.author ? `<p><strong>Author:</strong> ${book.author}</p>` : ''}
            <p><strong>Borrowed on:</strong> ${new Date(loan.borrowedAt).toLocaleDateString('en-US')}</p>
            <p><strong>Due date:</strong> ${new Date(loan.dueDate).toLocaleDateString('en-US')}</p>
          </div>

          <p>Please return the book to the library as soon as possible during opening hours.</p>
          <p>Thank you!</p>
        </div>
        <div class="footer">
          <p>Library Management System</p>
          <p>This email was sent automatically, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${user.fullName},

${isOverdue
  ? `The book "${book.title}" was due ${Math.abs(daysUntilDue)} days ago.`
  : `This is a reminder that you need to return the book "${book.title}" in ${daysUntilDue} days.`
}

Book Details:
- Title: ${book.title}
${book.author ? `- Author: ${book.author}` : ''}
- Borrowed on: ${new Date(loan.borrowedAt).toLocaleDateString('en-US')}
- Due date: ${new Date(loan.dueDate).toLocaleDateString('en-US')}

Please return the book to the library as soon as possible.

Thank you!
Library Management System
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

export const sendBatchReminderEmail = async (user, loans) => {
  const subject = `Reminder: Return \${loans.length} Books`;

  const booksListHtml = loans.map(loan => `
    <li>
      <strong>${loan.book.title}</strong>
      ${loan.book.author ? `- ${loan.book.author}` : ''}
      (Due: ${new Date(loan.dueDate).toLocaleDateString('en-US')})
    </li>
  `).join('');

  const booksListText = loans.map(loan =>
    `- ${loan.book.title}${loan.book.author ? ` - ${loan.book.author}` : ''} (Due: ${new Date(loan.dueDate).toLocaleDateString('en-US')})`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
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
          <h1>📚 Books Return Reminder</h1>
        </div>
        <div class="content">
          <h2>Hello \${user.fullName},</h2>
          <p>You have \${loans.length} books that need to be returned soon:</p>

          <div class="books-list">
            <ul>
              ${booksListHtml}
            </ul>
          </div>

          <p>Please return the books to the library during opening hours.</p>
          <p>Thank you!</p>
        </div>
        <div class="footer">
          <p>Library Management System</p>
          <p>This email was sent automatically, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello \${user.fullName},

You have \${loans.length} books that need to be returned soon:

${booksListText}

Please return the books to the library during opening hours.

Thank you!
Library Management System
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
