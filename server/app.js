const express = require('express');
const dotenv = require('dotenv');
const app = express();

// Load environment variables
dotenv.config();

// Middleware
app.use(express.json());

// Routes (example)
app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;