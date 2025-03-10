require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Or any port you prefer

// --- DATABASE CONFIGURATION (IMPORTANT!) ---
// Use environment variables for sensitive information!
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',      // Use environment variable, fallback to 'postgres'
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'guestbook',
  password: process.env.DB_PASSWORD || '510500', // REPLACE with your actual password!  And use an env var in production!
  port: process.env.DB_PORT || 5432,
});

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies (form data)
app.use(express.json()); // IMPORTANT: Also parse JSON bodies (for future API flexibility)
app.use(express.static('public')); // Serve static files (like index.html) from the 'public' folder

// --- API ENDPOINTS ---

// GET all guestbook entries
app.get('/api/entries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM entries ORDER BY created_at DESC');
    res.json(result.rows); // Send the entries as JSON
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error: ' + err.message); // More informative error message
  }
});

// POST a new guestbook entry
app.post('/api/entries', async (req, res) => {
  const { name, message } = req.body;

  // Basic validation (always validate user input!)
  if (!name || !message) {
    return res.status(400).send('Name and message are required.');
  }

  try {
    const result = await pool.query(
      'INSERT INTO entries (name, message) VALUES ($1, $2) RETURNING *', //RETURNING * will return the new inserted row.
      [name, message]
    );
    // Send back the newly created entry
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error: ' + err.message); // More informative error
  }
});

// --- START THE SERVER ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});