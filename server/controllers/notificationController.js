const { pool } = require('../config/dbConfig');

// @desc    Get notifications for a specific user
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const [notifications] = await pool.execute(
      `SELECT * FROM Notification 
       WHERE id_utilisateur = ? 
       ORDER BY date_envoi DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get notifications for admin users
// @route   GET /api/notifications/admin
// @access  Private (Admin/Responsible only)
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
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get notifications for technicians
// @route   GET /api/notifications/tech
// @access  Private (Technicians only)
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
    console.error('Error fetching technician notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE Notification SET statut = "lu" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  getAdminNotifications,
  getTechnicianNotifications,
  markNotificationAsRead
};