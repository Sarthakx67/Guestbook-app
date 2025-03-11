// db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV === 'production') {
  // On Render (production) - USE DATABASE_URL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // REQUIRED for Render's free PostgreSQL
    }
  });
} else {
  // Local development - use .env variables
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
  });
}

// const pool = new Pool({
// user: process.env.DB_USER,
// host: process.env.DB_HOST,
// database: process.env.DB_NAME,
// password: process.env.DB_PASSWORD,
// port: parseInt(process.env.DB_PORT) || 5432,
// });

const connectDB = async () => {
try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database:', process.env.DB_NAME);
    client.release(); // Release the client after checking the connection
} catch (error) {
    console.error('Error connecting to PostgreSQL database:', error.message);
    process.exit(1);
}
};

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error executing query:', error.message); // Log the error message
        throw error; // Re-throw the error so it can be handled by the caller
    }
};

module.exports = {
connectDB,
query,
};

process.on('exit', () => {
pool.end()
    .then(() => console.log('Database connection pool closed'))
    .catch((err) => console.error('Error closing database connection pool', err));
});
