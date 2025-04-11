const mongoose = require('mongoose');

// @desc    Auth user by email only & get role
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Login attempt with email:', email);

    // Get reference to the database
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database connection not established');
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data including role
    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { authUser };