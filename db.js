// db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV === 'production') {
    // Production (Render): Use DATABASE_URL and enable keepAlive
    console.log("=== Production Environment ===");
    console.log("DATABASE_URL:", process.env.DATABASE_URL); // Log for verification

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // REQUIRED for Render's free PostgreSQL (NOT for production security)
            },
            keepAlive: true, // IMPORTANT: Enable keepalive
        });
        console.log("Pool created successfully (production).");

        // Immediate Connection Test (with keepAlive, this is less critical, but still good for startup checks)
        pool.connect()
            .then(client => {
                console.log('Successfully connected to PostgreSQL (initial test)');
                client.release(); // Release immediately
            })
            .catch(err => {
                console.error('IMMEDIATE CONNECTION TEST FAILED (production):', err);
                process.exit(1); // Exit on connection failure
            });

    } catch (error) {
        console.error("Error creating Pool (production):", error);
        process.exit(1);
    }

} else {
    // Local development: Use .env variables and enable keepAlive
    console.log("=== Development Environment ===");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "NOT SET"); // Mask password
    console.log("DB_PORT:", process.env.DB_PORT);

    try {
        pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT) || 5432,
            keepAlive: true, // Enable keepalive for local development too
        });
        console.log("Pool created successfully (development).");
    } catch (error) {
        console.error("Error creating Pool (development):", error);
        process.exit(1);
    }
}

/**
 * Connects to the PostgreSQL database and logs the connected database name.
 * @async
 * @function connectDB
 */
const connectDB = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log('Connected to PostgreSQL database:', pool.options.database); // Log connected database
        client.release(); // Always release the client
    } catch (error) {
        console.error('Error connecting to PostgreSQL database:', error.message);
        process.exit(1); // Exit on fatal error
    }
};

/**
 * Executes a SQL query against the PostgreSQL database.
 * @async
 * @function query
 * @param {string} text - The SQL query string (use parameterized queries).
 * @param {any[]} [params] - Optional parameters for the query.
 * @returns {Promise<pg.QueryResult>} The query result.
 * @throws {Error} If the query fails.
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', { text, duration, rows: res.rowCount }); // Log query details
        return res;
    } catch (error) {
        console.error('Error executing query:', error); // Log the full error object
        throw error; // Re-throw to be handled by the calling function
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

process.on('SIGINT', () => {
    pool.end()
    .then(()=> console.log("Successfully disconnected"))
    .catch((e) => console.log(e.message))
    process.exit(0);

});
process.on('SIGTERM', () => {
    pool.end()
    .then(()=> console.log("Successfully disconnected"))
    .catch((e) => console.log(e.message))
    process.exit(0);
});