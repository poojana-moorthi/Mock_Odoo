const mysql = require('mysql2/promise');
const path = require('path');

// Ensure env variables are loaded (in case db.js is executed directly or required first)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shiv_erp',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00' // Store dates in UTC
};

const pool = mysql.createPool(dbConfig);

// Perform a test connection to ensure credentials are correct
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database "${dbConfig.database}" on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
  } catch (error) {
    console.error('[Database Error] Failed to establish database connection:', error.message);
    console.error('[Database Error] Please check your database settings in the server/.env file.');
  }
})();

module.exports = pool;
