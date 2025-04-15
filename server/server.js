const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const reservationRoutes = require('./routes/reservationRoutes'); // Add this line
const notificationRoutes = require('./routes/notificationRoutes'); // Add this with your other route imports
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/reservations', reservationRoutes); // Add this line
app.use('/api/notifications', notificationRoutes); // Add this with your other app.use() statements
app.use('/api/contact', contactRoutes);

// Define port
const PORT = process.env.PORT || 8080;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});