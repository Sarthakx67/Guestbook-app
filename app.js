// app.js
const express = require('express');
const path = require('path');
const { connectDB, query } = require('./db'); // Import
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3001;

// --- Database Connection ---
connectDB();

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- View Engine Setup (EJS) ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Input Validation Rules ---
const validateGuestbookEntry = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required.')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Message is required.')
    .escape(),
];


// --- Routes ---

// GET / - Display the guestbook entries
app.get('/', async (req, res) => {
    try {
        // *** REPLACE THIS WITH DATABASE QUERY ***
        const result = await query('SELECT * FROM guestbook_entries ORDER BY timestamp DESC');
        const entries = result.rows;
         res.render('index', { entries, errors: [] }); // Pass entries and an empty error array initially

    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).send('Error fetching entries');
    }
});

// POST /add - Add a new guestbook entry
app.post('/add', validateGuestbookEntry, async (req, res) => {
    try {
         const errors = validationResult(req);
        if (!errors.isEmpty()) {
        // Validation failed, re-render the form with errors
        const result = await query('SELECT * FROM guestbook_entries ORDER BY timestamp DESC');
        const entries = result.rows;
        return res.render('index', { entries, errors: errors.array() }); // Pass errors to the template
        }
        const { name, message } = req.body;

        // *** REPLACE THIS WITH DATABASE INSERT ***
        await query(
          'INSERT INTO guestbook_entries (name, message) VALUES ($1, $2)',
          [name, message]
        );

        res.redirect('/');
    } catch (error) {
        console.error('Error adding entry:', error);
        res.status(500).send('Error adding entry');
    }
});

// --- Start the Server ---

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});