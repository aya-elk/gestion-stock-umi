const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GESTION_STOCK',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

    // SQL query to find user by email
    const [users] = await pool.execute(
      'SELECT * FROM Utilisateur WHERE email = ?', 
      [email]
    );

    // Check if user exists
    const user = users[0];
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    // Verify password (in real app, use bcrypt for hashed passwords)
    if (user.mot_de_passe !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user data including role
    res.json({
      _id: user.id,
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