const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'form_db',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Enable SSL when connecting to AWS Aurora RDS or when DB_SSL is set
if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com'))) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

// Automatic Table Initialization with connection retry
const initDatabase = async (retries = 10, delay = 3000) => {
  while (retries > 0) {
    try {
      console.log(`Connecting to PostgreSQL database at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}...`);
      const client = await pool.connect();
      console.log('Successfully connected to PostgreSQL database!');

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS submissions (
          id SERIAL PRIMARY KEY,
          full_name VARCHAR(120) NOT NULL,
          email VARCHAR(120) NOT NULL,
          phone VARCHAR(25),
          category VARCHAR(50) DEFAULT 'General',
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await client.query(createTableQuery);
      console.log('Database table "submissions" verified / created successfully.');
      client.release();
      return;
    } catch (err) {
      retries -= 1;
      console.error(`Database connection failed: ${err.message}. Retries left: ${retries}`);
      if (retries === 0) {
        console.error('Fatal: Could not connect to the database after maximum retries.');
        break;
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

module.exports = {
  pool,
  initDatabase,
};
