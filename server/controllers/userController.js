const User = require('../models/userModel');

// @desc    Auth user & get role
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // For now, we're just checking if the email exists and returning the role
    // In a production app, you would validate the password here
    const user = await User.findOne({ email });

    if (user) {
      res.json({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(`Error in authUser: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { authUser };