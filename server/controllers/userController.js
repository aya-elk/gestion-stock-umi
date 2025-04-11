const mongoose = require('mongoose');

// @desc    Auth user with email & password & get role
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
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
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    // Verify password (compare with mot_de_passe field from db)
    if (user.mot_de_passe !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
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