const express = require('express');
const connectDB = require('./dbConnect'); // Use the new connection file
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Routes
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;