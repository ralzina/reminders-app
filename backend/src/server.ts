import express = require('express')
import type { Request, Response } from 'express';
const { Pool } = require('pg')
import bcrypt = require('bcryptjs')
const path = require('path')
const dotenv = require('dotenv')

dotenv.config({path: path.resolve(__dirname, '../../.env') });

const cors = require('cors');

import cookieParser = require('cookie-parser')
import jwt = require('jsonwebtoken')

const app = express();
const port = 9000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
}))

app.options('/*splat', cors());

app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

app.get('/', (req, res) => {
    res.send('MY EXPRESS SERVER IS RUNNING');
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({error: 'Email and password are required'});
    }
    
    const lowerEmail = email.toLowerCase();
    console.log(`Login attempt for: ${email}`);

    try {
        const queryText = 'SELECT id, email, password FROM users WHERE email = $1';
        const result = await pool.query(queryText, [lowerEmail]);

        const jwtSecret = process.env.JWT_SECRET

        if (!jwtSecret){
            throw new Error('JWT_SECRET not defined in enviornment variables')
        }

        if (result.rows.length == 0){
            console.log(`Email not found, creating user ${lowerEmail}`)

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds)

            const insertText = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email';
            const insertResult = await pool.query(insertText, [lowerEmail, hashedPassword]);
            const newUser = insertResult.rows[0];
        
            const token = jwt.sign(
                { id: newUser.id },
                jwtSecret,
                {expiresIn: '1d'});

            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000
            });
    
            // Return registration success and welcome message
            return res.status(201).json({
                message: 'Registration successful! Welcome to the app!',
                user: { id: newUser.id, email: newUser.email }
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({error: 'Invalid email or password'});
        }

        const token = jwt.sign(
            {id: user.id },
            jwtSecret,
            { expiresIn: '1d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        })

        res.status(200).json({
            message: 'Login successful!',
            user: { id: user.id, email: user.email}
        });
    }catch (error) {
        console.error('Database error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})