const { pool } = require('../config/dbConfig');

// @desc    Récupérer les notifications pour un utilisateur spécifique
// @route   GET /api/notifications
// @access  Privé
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }

    const [notifications] = await pool.execute(
      `SELECT * FROM Notification 
       WHERE id_utilisateur = ? 
       ORDER BY date_envoi DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Récupérer les notifications pour les administrateurs
// @route   GET /api/notifications/admin
// @access  Privé (Admin/Responsable uniquement)
const getAdminNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      `SELECT n.*, u.nom, u.prenom 
       FROM Notification n
       JOIN Utilisateur u ON n.id_utilisateur = u.id
       WHERE u.role = 'responsable'
       ORDER BY n.date_envoi DESC`
    );

    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications administrateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Récupérer les notifications pour les techniciens
// @route   GET /api/notifications/tech
// @access  Privé (Techniciens uniquement)
const getTechnicianNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      `SELECT n.*, u.nom, u.prenom 
       FROM Notification n
       JOIN Utilisateur u ON n.id_utilisateur = u.id
       WHERE u.role = 'technicien'
       ORDER BY n.date_envoi DESC`
    );

    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications technicien:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Marquer une notification comme lue
// @route   PATCH /api/notifications/:id
// @access  Privé
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE Notification SET statut = "lu" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  getAdminNotifications,
  getTechnicianNotifications,
  markNotificationAsRead
};