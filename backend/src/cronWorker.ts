import cron = require('node-cron');
import pool = require('./db');
import sendWhatAppMessage = require('./whatsapp');

const checkAndExecuteReminders = async () => {
    const now = new Date();

    console.log(`\n[${now.toLocaleTimeString()}] System Clock: Scanning for due reminders..`);

    try {
        const queryText = `
            SELECT r.*, u.phone
            FROM reminders r
            INNER JOIN users u ON r.user_id = u.id
            WHERE r.next_reminder <= NOW()
        `
        const result = await pool.query(queryText);
        const dueReminders = result.rows;

        if (dueReminders.length === 0) {
            console.log(`[${now.toLocaleTimeString()}] No reminders due at this minute.`);
            return;
        }

        console.log(`[${now.toLocaleTimeString()}] Found ${dueReminders.length} due reminders!`);

        for(const reminder of dueReminders) {
            console.log(`Sending ${reminder.phone}:${reminder.reminder_text}`)

            await sendWhatAppMessage(reminder.phone, reminder.reminder_text)

            if (!reminder.is_periodic) {
                console.log('Reminder lifetime complete');
                await pool.query('DELETE FROM reminders WHERE id = $1', [reminder.id]);
            } else {
                console.log('Periodic loop');
                const intervalString = `${reminder.weeks} weeks ${reminder.days} days ${reminder.hours} hours`;

                const updateTimeQuery = `
                    UPDATE reminders
                    SET next_reminder = next_reminder + INTERVAL $1
                    WHERE id = $2
                    RETURNING next_reminder
                `;

                const updateResult = await pool.query(updateTimeQuery, [intervalString, reminder.id]);
                const newlyCalculatedNextRun = updateResult.rows[0].next_reminder

                if (reminder.until && new Date(newlyCalculatedNextRun) > new Date(reminder.until)) {
                    console.log('Periodic reminder lifetime finished');
                    await pool.query('DELETE FROM reminders WHERE is = $1', [reminder.id]);
                } else {
                    console.log('Set next periodic execution')
                }
            }
        }


    } catch (error) {
        console.error('Cron execution error:', error);
    }
};

const initCronJobs = () => {
    cron.schedule('* * * * *', () => {
        checkAndExecuteReminders();
    });
    console.log('Cron engine initialized')
}

export = { initCronJobs };