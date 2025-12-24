import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Create a connection pool to the MySQL database
 * The pool allows multiple clients to connect and query the database concurrently
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


export default pool;