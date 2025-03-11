// db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV === 'production') {
    // On Render (production)
    console.log("=== Production Environment ===");
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Log for debugging

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // REQUIRED for Render's free PostgreSQL, but NOT for production!
            }
        });
        console.log("Pool created successfully (production).");

        // Immediate Connection Test (CRUCIAL for debugging)
        pool.connect()
            .then(client => {
                console.log('Successfully connected to PostgreSQL (initial test)');
                client.release(); // Release immediately after testing
            })
            .catch(err => {
                console.error('IMMEDIATE CONNECTION TEST FAILED (production):', err);
                process.exit(1); // Exit on connection failure
            });

    } catch (error) {
        console.error("Error creating Pool (production):", error);
        process.exit(1); // Exit if pool creation fails
    }

} else {
    // Local development
    console.log("=== Development Environment ===");
    console.log("DB_USER:", process.env.DB_USER);          // Log for debugging
    console.log("DB_HOST:", process.env.DB_HOST);          // Log for debugging
    console.log("DB_NAME:", process.env.DB_NAME);          // Log for debugging
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "NOT SET"); // Mask password
    console.log("DB_PORT:", process.env.DB_PORT);          // Log for debugging

    try {
        pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT) || 5432,
        });
        console.log("Pool created successfully (development).");
    } catch (error) {
        console.error("Error creating Pool (development):", error);
        process.exit(1);
    }
}

/**
 * Connects to the PostgreSQL database.  This function now only *tests* the connection
 * and logs success/failure.  The actual connection pooling is handled by the `pool` object.
 * @async
 * @function connectDB
 * @throws {Error} If the database connection fails.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  let client; // Declare client outside the try block
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database:', pool.options.database);
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error.message);
    process.exit(1);
  }
};

/**
 * Executes a SQL query against the PostgreSQL database.
 * @async
 * @function query
 * @param {string} text - The SQL query string (use parameterized queries!).
 * @param {any[]} [params] - An optional array of parameters for the query.
 * @throws {Error} If the query fails.
 * @returns {Promise<pg.QueryResult>} The result of the query.
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error executing query:', error); // Log full error object
        throw error; // Re-throw to be handled by caller
    }
};

module.exports = {
    connectDB,
    query,
};

// Graceful shutdown on process exit/interrupt/termination
process.on('exit', () => {
    pool.end()
        .then(() => console.log('Database connection pool closed'))
        .catch((err) => console.error('Error closing database connection pool', err));
});

process.on('SIGINT', () => { // Handle Ctrl+C
    pool.end()
        .then(() => console.log('Database connection pool closed due to SIGINT'))
        .catch((err) => console.error('Error closing database connection pool due to SIGINT', err));
    process.exit(0); // Exit with success code after cleanup
});

process.on('SIGTERM', () => { // Handle termination signal
    pool.end()
        .then(() => console.log('Database connection pool closed due to SIGTERM'))
        .catch((err) => console.error('Error closing database connection pool due to SIGTERM', err));
    process.exit(0); // Exit with success code after cleanup
});