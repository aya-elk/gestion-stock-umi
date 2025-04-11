const express = require('express');
const router = express.Router();
const { authUser } = require('../controllers/userController');

// Login route
router.post('/login', authUser);

module.exports = router;