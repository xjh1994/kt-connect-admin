require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kt_connect_admin',
};

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

const db = {
  async all(sql, params = []) {
    const [rows] = await getPool().execute(sql, params);
    return rows;
  },

  async get(sql, params = []) {
    const [rows] = await getPool().execute(sql, params);
    return rows[0];
  },

  async run(sql, params = []) {
    const [result] = await getPool().execute(sql, params);
    return result;
  },

  async close() {
    if (pool) {
      await pool.end();
      pool = null;
    }
  },
};

module.exports = db;
