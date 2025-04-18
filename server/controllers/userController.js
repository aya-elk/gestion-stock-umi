const { pool } = require('../config/dbConfig');

// @desc    Authentifie l'utilisateur avec email & mot de passe & obtenir le rôle
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    console.log('Tentative de connexion avec email:', email);

    // Requête SQL pour trouver l'utilisateur par email
    const [users] = await pool.execute(
      'SELECT * FROM Utilisateur WHERE email = ?',
      [email]
    );

    // Vérifier si l'utilisateur existe
    const user = users[0];
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

    if (!user) {
      return res.status(404).json({ message: 'Email ou mot de passe invalide' });
    }

    // Vérifier le mot de passe (dans une vraie application, utiliser bcrypt pour les mots de passe hashés)
    if (user.mot_de_passe !== password) {
      return res.status(401).json({ message: 'Email ou mot de passe invalide' });
    }

    // Retourner les données de l'utilisateur incluant le rôle
    res.json({
      _id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { authUser };