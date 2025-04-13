const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv-flow').config();
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const reservationRoutes = require('./routes/reservationRoutes'); // Add this line

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/reservations', reservationRoutes); // Add this line

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GESTION_STOCK',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB connection
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL database connected');
    connection.release();
  } catch (error) {
    console.error('MySQL connection error:', error);
  }
};

// Test the connection
testDbConnection();

// Define port
const PORT = process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});