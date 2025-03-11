// db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.NODE_ENV === 'production') {
  // On Render (production)
  console.log("=== Production Environment ===");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log("Pool created successfully (production).");

    // TEST CONNECTION IMMEDIATELY (Crucial Addition)
    pool.connect()
      .then(client => {
        console.log('Successfully connected to PostgreSQL (initial test)');
        client.release(); // Release immediately after testing
      })
      .catch(err => {
        console.error('IMMEDIATE CONNECTION TEST FAILED (production):', err); // Log the FULL error object
        process.exit(1);
      });


  } catch (error) {
    console.error("Error creating Pool (production):", error);
    process.exit(1);
  }

} else {
  // Local development (Keep as is - you're not having local issues)
    console.log("=== Development Environment ==="); // Log environment
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "********" : "NOT SET"); // NEVER log the actual password!
  console.log("DB_PORT:", process.env.DB_PORT);

  try { // Add a try-catch block *around* the Pool creation
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432,
    });
    console.log("Pool created successfully (development)."); //Log success
  } catch(error) {
     console.error("Error creating Pool (development):", error);
     process.exit(1);
  }
}

// Keep the rest of db.js the same (connectDB, query, process.on('exit'))
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

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
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
process.on('SIGINT', () => { //for handling Ctrl + C
    pool.end()
      .then(() => console.log('Database connection pool closed due to SIGINT'))
      .catch((err) => console.error('Error closing database connection pool due to SIGINT', err));
      process.exit(0);
  });

  process.on('SIGTERM', () => { // for handling termination signal
    pool.end()
    .then(() => console.log('Database connection pool closed due to SIGTERM'))
    .catch((err) => console.error('Error closing database connection pool due to SIGTERM', err));
    process.exit(0);
});