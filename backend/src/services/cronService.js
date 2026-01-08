import cron from 'node-cron';
import { Op } from 'sequelize';
import { Loan, User, Book } from '../models/index.js';
import { config } from '../config/config.js';
import { sendLoanReminderEmail, sendBatchReminderEmail } from './emailService.js';

// Send reminders for loans that are due soon
const sendLoanReminders = async () => {
  try {
    console.log('🔄 Starting loan reminders job...');

    // Calculate the date threshold (today + reminderDaysBefore)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + config.loan.reminderDaysBefore);

    // Find all active loans that:
    // 1. Are not returned yet (returnedAt is null)
    // 2. Due date is within the reminder period
    // 3. Reminder hasn't been sent yet
    const loansToRemind = await Loan.findAll({
      where: {
        returnedAt: null,
        dueDate: {
          [Op.lte]: reminderDate
        },
        reminderSent: false
      },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ]
    });

    if (loansToRemind.length === 0) {
      console.log('✅ No loans require reminders');
      return { success: true, count: 0 };
    }

    console.log(`📧 Found ${loansToRemind.length} loans requiring reminders`);

    // Group loans by user
    const loansByUser = {};
    loansToRemind.forEach(loan => {
      const userId = loan.userId;
      if (!loansByUser[userId]) {
        loansByUser[userId] = {
          user: loan.user,
          loans: []
        };
      }
      loansByUser[userId].loans.push(loan);
    });

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each user
    for (const userId in loansByUser) {
      const { user, loans } = loansByUser[userId];

      try {
        // If user has multiple loans, send batch email
        if (loans.length > 1) {
          const result = await sendBatchReminderEmail(user, loans);

          if (result.success) {
            // Mark all loans as reminded
            for (const loan of loans) {
              await loan.markReminderSent();
            }
            successCount += loans.length;
            console.log(`✅ Batch reminder sent to ${user.email} for ${loans.length} loans`);
          } else {
            errorCount += loans.length;
            console.error(`❌ Failed to send batch reminder to ${user.email}`);
          }
        } else {
          // Single loan - send individual email
          const loan = loans[0];
          const result = await sendLoanReminderEmail(loan, user, loan.book);

          if (result.success) {
            await loan.markReminderSent();
            successCount++;
            console.log(`✅ Reminder sent to ${user.email} for "${loan.book.title}"`);
          } else {
            errorCount++;
            console.error(`❌ Failed to send reminder to ${user.email}`);
          }
        }
      } catch (error) {
        errorCount += loans.length;
        console.error(`❌ Error sending reminder to ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Loan reminders job completed: ${successCount} sent, ${errorCount} failed`);

    return {
      success: true,
      total: loansToRemind.length,
      sent: successCount,
      failed: errorCount
    };
  } catch (error) {
    console.error('❌ Error in sendLoanReminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update loan statuses (mark as overdue if needed)
const updateLoanStatuses = async () => {
  try {
    console.log('🔄 Updating loan statuses...');

    const now = new Date();

    // Find all active loans that are past due date
    const overdueLoans = await Loan.findAll({
      where: {
        returnedAt: null,
        dueDate: {
          [Op.lt]: now
        },
        status: {
          [Op.ne]: 'overdue'
        }
      }
    });

    if (overdueLoans.length === 0) {
      console.log('✅ No loans to mark as overdue');
      return { success: true, count: 0 };
    }

    // Update status to overdue
    let updateCount = 0;
    for (const loan of overdueLoans) {
      loan.status = 'overdue';
      await loan.save();
      updateCount++;
    }

    console.log(`✅ Marked ${updateCount} loans as overdue`);

    return {
      success: true,
      count: updateCount
    };
  } catch (error) {
    console.error('❌ Error in updateLoanStatuses:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Combined daily job
const runDailyJobs = async () => {
  console.log('\n===========================================');
  console.log('🌅 Running daily maintenance jobs');
  console.log(`⏰ ${new Date().toLocaleString('he-IL')}`);
  console.log('===========================================\n');

  // Update loan statuses first
  await updateLoanStatuses();

  // Then send reminders
  await sendLoanReminders();

  console.log('\n===========================================');
  console.log('✅ Daily jobs completed');
  console.log('===========================================\n');
};

// Initialize cron jobs
export const initCronJobs = () => {
  console.log('⏰ Initializing cron jobs...');

  // Daily job - runs based on config schedule (default: 9 AM)
  cron.schedule(config.loan.reminderCronSchedule, async () => {
    await runDailyJobs();
  });

  console.log(`✅ Cron jobs initialized: ${config.loan.reminderCronSchedule}`);
  console.log(`   - Next run: ${getNextCronRun(config.loan.reminderCronSchedule)}`);
};

// Helper to get next cron run time
const getNextCronRun = (cronExpression) => {
  try {
    const parts = cronExpression.split(' ');
    if (parts.length >= 2) {
      const hour = parseInt(parts[1]);
      const minute = parseInt(parts[0]);

      const next = new Date();
      next.setHours(hour, minute, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (next < new Date()) {
        next.setDate(next.getDate() + 1);
      }

      return next.toLocaleString('he-IL');
    }
  } catch (error) {
    return 'Unknown';
  }
  return 'Unknown';
};

// Manual trigger functions (for testing or admin use)
export const manualSendReminders = async () => {
  console.log('🔧 Manual trigger: Sending reminders...');
  return await sendLoanReminders();
};

export const manualUpdateStatuses = async () => {
  console.log('🔧 Manual trigger: Updating statuses...');
  return await updateLoanStatuses();
};

export const manualRunDailyJobs = async () => {
  console.log('🔧 Manual trigger: Running daily jobs...');
  return await runDailyJobs();
};

export default {
  initCronJobs,
  manualSendReminders,
  manualUpdateStatuses,
  manualRunDailyJobs
};
