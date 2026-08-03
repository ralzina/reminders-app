import express = require('express')
import type { Request, Response } from 'express';
import pool = require('./db')
import bcrypt = require('bcryptjs')
const path = require('path')
const dotenv = require('dotenv')
import cronWorker = require('./cronWorker')

dotenv.config({path: path.resolve(__dirname, '../../.env') });

const cors = require('cors');

import cookieParser = require('cookie-parser')
import jwt = require('jsonwebtoken')

const BACKEND_PORT: number = parseInt(process.env.PORT || '9000', 10);
const FRONTEND_URL = process.env.VITE_FRONTEND_URL || 'https://localhost:5173';

const app = express();
const port = BACKEND_PORT

const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin) {
        return callback(null, true);
      }
  
      const isAllowed =
        origin === FRONTEND_URL ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app');
  
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
  };
  
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('MY EXPRESS SERVER IS RUNNING');
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({error: 'phone and password are required'});
    }
    
    console.log(`Login attempt for: ${phone}`);

    try {
        const queryText = 'SELECT id, phone, password FROM users WHERE phone = $1';
        const result = await pool.query(queryText, [phone]);

        const jwtSecret = process.env.JWT_SECRET

        if (!jwtSecret){
            throw new Error('JWT_SECRET not defined in enviornment variables')
        }

        if (result.rows.length == 0){
            console.log(`Phone not found, creating user ${phone}`)

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds)

            const insertText = 'INSERT INTO users (phone, password) VALUES ($1, $2) RETURNING id, phone';
            const insertResult = await pool.query(insertText, [phone, hashedPassword]);
            const newUser = insertResult.rows[0];
        
            const token = jwt.sign(
                { id: newUser.id },
                jwtSecret,
                {expiresIn: '1d'});

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,      
                sameSite: 'none',  
                maxAge: 24 * 60 * 60 * 1000
            });
    
            // Return registration success and welcome message
            return res.status(201).json({
                message: 'Registration successful! Welcome to the app!',
                user: { id: newUser.id, phone: newUser.phone }
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({error: 'Invalid phone or password'});
        }

        const token = jwt.sign(
            {id: user.id },
            jwtSecret,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,      
            sameSite: 'none',  
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: 'Login successful!',
            user: { id: user.id, phone: user.phone}
        });
    }catch (error) {
        console.error('Database error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV == 'production',
        sameSite: 'lax'
    });

    return res.status(200).json({message: 'Logged out successfully'});
});

app.post('/api/reminders', async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({error: "Unauthorized. Please log in first."});
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET missing from enviornment variables');
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string };

        const authenticUserId = decoded.id;
        console.log(`Verified post request from User UUID: ${authenticUserId}`)

        const { text, startDate, isPeriodic, period, until } = req.body;

        if (isPeriodic && (!period || !until || (period.weeks === 0 && period.days === 0 && period.hours === 0))) {
            console.log(period, until)
            return res.status(400).json({ 
                error: 'Periodic reminders must have a repeat interval set (at least 1 hour, day, or week).' 
            });
        }

        const countQuery = `
            SELECT COUNT(*) FROM reminders 
            WHERE user_id = $1
        `;
        const countResult = await pool.query(countQuery, [authenticUserId]);
        const activeReminderCount = parseInt(countResult.rows[0].count, 10);

        const MAX_REMINDERS_ALLOWED = 10;
        if (activeReminderCount >= MAX_REMINDERS_ALLOWED) {
            return res.status(400).json({ 
                error: `Limit reached. You can only have a maximum of ${MAX_REMINDERS_ALLOWED} active reminders at once.` 
            });
        }

        const insertText = `
            INSERT INTO reminders (user_id, reminder_text, start_date, next_reminder, is_periodic, weeks, days, hours, until)
            VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const result = await pool.query(insertText, [
            authenticUserId,
            text,
            startDate,
            isPeriodic,
            period?.weeks || 0,
            period?.days || 0,
            period?.hours || 0,
            until
        ]);

        return res.status(201).json({
            message: 'Reminder successfully created!',
            reminder: result.rows[0]
        });
    } catch (error) {
        console.error('Security alert or token error:', error)
        return res.status(403).json({error: 'Invalid or expired session token.'});
    }
});

app.get('/api/reminders', async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({error: "Unauthorized. Please log in first."});
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET missing from enviornment variables');
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string };

        const authenticUserId = decoded.id;
        console.log(`Verified get request from User UUID: ${authenticUserId}`)

        const getText = `
            SELECT * FROM reminders WHERE user_id = $1
        `;

        const result = await pool.query(getText, [
            authenticUserId,
        ]);

        return res.status(201).json({
            message: 'Reminder successfully created!',
            reminders: result.rows
        });
    } catch (error) {
        console.error('Security alert or token error:', error)
        return res.status(403).json({error: 'Invalid or expired session token.'});
    }
});

app.delete('/api/reminders/:id', async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({error: "Unauthorized. Please log in first."});
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET missing from enviornment variables');
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string };

        const authenticUserId = decoded.id;
        console.log(`Verified delete request from User UUID: ${authenticUserId}`)

        const id = req.params.id;

        const deleteText = `
            DELETE FROM reminders WHERE id = $1 AND user_id = $2;
        `;

        const result = await pool.query(deleteText, [
            id,
            authenticUserId
        ]);

        return res.status(200).json({
            message: 'Reminder successfully deleted!',
        });
    } catch (error) {
        console.error('Security alert or token error:', error)
        return res.status(403).json({error: 'Invalid or expired session token.'});
    }
});

app.put('/api/reminders/:id', async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({error: "Unauthorized. Please log in first."});
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET missing from enviornment variables');
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string };

        const authenticUserId = decoded.id;
        console.log(`Verified put request from User UUID: ${authenticUserId}`)

        const { text, startDate, isPeriodic, period, until } = req.body;

        const id = req.params.id;

        if (isPeriodic && (!period || !until || (period.weeks === 0 && period.days === 0 && period.hours === 0))) {
            console.log(period, until)
            return res.status(400).json({ 
                error: 'Periodic reminders must have a repeat interval set (at least 1 hour, day, or week).' 
            });
        }

        const putText = `
            UPDATE reminders
            SET reminder_text = $1,
                start_date = $2,
                is_periodic = $3,
                weeks = $4,
                days = $5,
                hours = $6,
                until = $7
            WHERE id = $8 AND user_id = $9
            RETURNING *;
        `;

        const result = await pool.query(putText, [
            text,
            startDate,
            isPeriodic,
            period?.weeks || 0,
            period?.days || 0,
            period?.hours || 0,
            until || null,
            id,
            authenticUserId
        ]);

        return res.status(201).json({
            message: 'Reminder successfully created!',
            reminder: result.rows[0]
        });
    } catch (error) {
        console.error('Security alert or token error:', error)
        return res.status(403).json({error: 'Invalid or expired session token.'});
    }
});

app.delete('/api/auth/:id', async (req: Request, res: Response) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({error: "Unauthorized. Please log in first."});
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET missing from enviornment variables');
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string };

        const authenticUserId = decoded.id;
        console.log(`Verified delete request from User UUID: ${authenticUserId}`)

        const id = req.params.id;

        const deleteText = `
            DELETE FROM reminders WHERE id = $1;
        `;

        const result = await pool.query(deleteText, [
            authenticUserId
        ]);

        return res.status(200).json({
            message: 'User successfully deleted!',
        });
    } catch (error) {
        console.error('Security alert or token error:', error)
        return res.status(403).json({error: 'Invalid or expired session token.'});
    }
})

app.post('/api/cron/check-reminders', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const expectedHeader = `Bearer ${process.env.CRON_SECRET}`;
  
    if (!authHeader || authHeader !== expectedHeader) {
      return res.status(401).json({ error: 'Unauthorized system request' });
    }
  
    try {
      const results = await cronWorker.checkAndExecuteReminders();
      return res.status(200).json({ success: true, processed: results });
    } catch (error) {
      console.error('Cron Execution Error:', error);
      return res.status(500).json({ error: 'Failed to process reminders' });
    }
  });

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at port ${port}`);

    if (process.env.ENV == 'local'){
        cronWorker.initCronJobs();
    }
});