const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  getAdminNotifications, 
  markNotificationAsRead 
} = require('../controllers/notificationController');

// Get notifications for a specific user
router.get('/', getUserNotifications);

// Get notifications for admin users
router.get('/admin', getAdminNotifications);

// Mark notification as read
router.patch('/:id', markNotificationAsRead);

module.exports = router;