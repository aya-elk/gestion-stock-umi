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

// @desc    Récupérer tous les utilisateurs
// @route   GET /api/users
// @access  Privé (Admin/Technicien seulement)
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nom, prenom, email, role FROM Utilisateur ORDER BY id DESC'
    );
    
    // Ne jamais renvoyer les mots de passe dans la réponse
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Créer un nouvel utilisateur
// @route   POST /api/users
// @access  Privé (Admin/Technicien seulement)
const createUser = async (req, res) => {
  try {
    const { id, nom, prenom, email, role, mot_de_passe } = req.body;
    
    if (!id || !nom || !prenom || !email || !role || !mot_de_passe) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Vérifier si l'ID existe déjà
    const [existingUsersById] = await pool.execute(
      'SELECT * FROM Utilisateur WHERE id = ?',
      [id]
    );
    
    if (existingUsersById.length > 0) {
      return res.status(400).json({ message: 'Cet ID est déjà utilisé' });
    }
    
    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.execute(
      'SELECT * FROM Utilisateur WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Insérer le nouvel utilisateur
    const [result] = await pool.execute(
      'INSERT INTO Utilisateur (id, nom, prenom, email, role, mot_de_passe) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nom, prenom, email, role, mot_de_passe] // Dans une vraie application, hasher le mot de passe
    );
    
    res.status(201).json({ 
      id: id,
      message: 'Utilisateur créé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la création d\'un utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Privé (Admin/Technicien seulement)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.execute(
      'SELECT * FROM Utilisateur WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    await pool.execute(
      'DELETE FROM Utilisateur WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { authUser, getUsers, createUser, deleteUser };