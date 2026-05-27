const dotenv = require('dotenv')
const path = require('path')
dotenv.config({path: path.resolve(__dirname, '../../.env') });


const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: 10, // 10 active parallel connections max
    idleTimeoutMillis: 30000 
});

export = pool;