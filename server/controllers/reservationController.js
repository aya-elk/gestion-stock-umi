const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GESTION_STOCK',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Public
const getAllReservations = async (req, res) => {
  try {
    const { userId, status, limit } = req.query;
    
    let query = `
      SELECT r.id as id_reservation, r.date_debut, r.date_fin, r.etat as statut, 
             r.id_utilisateur, e.id as id_equipement, e.nom as nom_equipement,
             u.nom as nom_utilisateur, u.prenom as prenom_utilisateur,
             re.quantite_reservee
      FROM Reservation r
      JOIN Reservation_Equipement re ON r.id = re.id_reservation
      JOIN Equipement e ON re.id_equipement = e.id
      JOIN Utilisateur u ON r.id_utilisateur = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (userId) {
      conditions.push('r.id_utilisateur = ?');
      params.push(userId);
    }
    
    if (status) {
      conditions.push('r.etat = ?');
      params.push(status);
    }
    
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Always order by date, most recent first
    query += ' ORDER BY r.date_debut DESC';
    
    // Add limit if specified
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const [reservations] = await pool.execute(query, params);
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get reservation by ID
// @route   GET /api/reservations/:id
// @access  Public
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [reservation] = await pool.execute(
      `SELECT r.id as id_reservation, r.date_debut, r.date_fin, r.etat as statut, 
              r.id_utilisateur, e.id as id_equipement, e.nom as nom_equipement,
              u.nom as nom_utilisateur, u.prenom as prenom_utilisateur,
              re.quantite_reservee
       FROM Reservation r
       JOIN Reservation_Equipement re ON r.id = re.id_reservation
       JOIN Equipement e ON re.id_equipement = e.id
       JOIN Utilisateur u ON r.id_utilisateur = u.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (reservation.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id_utilisateur, id_equipement, date_debut, date_fin, quantite, statut } = req.body;
    
    // Validate required fields
    if (!id_utilisateur || !id_equipement || !date_debut || !date_fin) {
      return res.status(400).json({ message: 'User ID, equipment ID, start date and end date are required' });
    }

    // Check if equipment exists and is available
    const [equipment] = await connection.execute(
      'SELECT * FROM Equipement e LEFT JOIN Solo s ON e.id = s.id WHERE e.id = ?',
      [id_equipement]
    );
    
    if (equipment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    const equip = equipment[0];
    // For solo equipment, check if it's available
    if (equip.categorie === 'solo' && equip.etat !== 'disponible') {
      await connection.rollback();
      return res.status(400).json({ message: 'Equipment is not available for reservation' });
    }
    
    // For stockable equipment, check quantity
    if (equip.categorie === 'stockable' && (equip.quantite < quantite || equip.quantite <= 0)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Not enough items available' });
    }
    
    // Insert into Reservation table
    const [result] = await connection.execute(
      'INSERT INTO Reservation (date_debut, date_fin, etat, id_utilisateur) VALUES (?, ?, ?, ?)',
      [date_debut, date_fin, statut || 'attente', id_utilisateur]
    );
    
    const reservationId = result.insertId;
    
    // Insert into Reservation_Equipement table
    await connection.execute(
      'INSERT INTO Reservation_Equipement (id_reservation, id_equipement, quantite_reservee) VALUES (?, ?, ?)',
      [reservationId, id_equipement, quantite || 1]
    );
    
    // If solo equipment, update its status to 'en_cours' if the reservation is confirmed
    if (equip.categorie === 'solo' && statut === 'validee') {
      await connection.execute(
        'UPDATE Solo SET etat = "en_cours" WHERE id = ?',
        [id_equipement]
      );
    }
    
    // If stockable equipment and reservation is confirmed, decrease available quantity
    if (equip.categorie === 'stockable' && statut === 'validee') {
      await connection.execute(
        'UPDATE Equipement SET quantite = quantite - ? WHERE id = ?',
        [quantite || 1, id_equipement]
      );
    }
    
    await connection.commit();
    
    // Create notification for the user
    try {
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [id_utilisateur, `Your reservation for ${equip.nom} has been submitted and is awaiting approval.`]
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail the request because of notification error
    }
    
    res.status(201).json({
      id: reservationId,
      message: 'Reservation created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Create batch reservation with multiple equipment
// @route   POST /api/reservations/batch
// @access  Private
const createBatchReservation = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id_utilisateur, date_debut, date_fin, items } = req.body;
    
    // Validate required fields
    if (!id_utilisateur || !date_debut || !date_fin || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Create a single reservation entry
    const [result] = await connection.execute(
      'INSERT INTO Reservation (date_debut, date_fin, etat, id_utilisateur) VALUES (?, ?, ?, ?)',
      [date_debut, date_fin, 'attente', id_utilisateur]
    );
    
    const reservationId = result.insertId;
    
    // Add all equipment items to the reservation
    for (const item of items) {
      const { id_equipement, quantite } = item;
      
      // Check if equipment exists and is available
      const [equipment] = await connection.execute(
        'SELECT * FROM Equipement e LEFT JOIN Solo s ON e.id = s.id WHERE e.id = ?',
        [id_equipement]
      );
      
      if (equipment.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Equipment ID ${id_equipement} not found` });
      }
      
      const equip = equipment[0];
      
      // For solo equipment, check if it's available
      if (equip.categorie === 'solo' && equip.etat !== 'disponible') {
        await connection.rollback();
        return res.status(400).json({ message: `Equipment ${equip.nom} is not available for reservation` });
      }
      
      // For stockable equipment, check quantity
      if (equip.categorie === 'stockable' && (equip.quantite < quantite || equip.quantite <= 0)) {
        await connection.rollback();
        return res.status(400).json({ message: `Not enough ${equip.nom} available` });
      }
      
      // Insert into Reservation_Equipement table
      await connection.execute(
        'INSERT INTO Reservation_Equipement (id_reservation, id_equipement, quantite_reservee) VALUES (?, ?, ?)',
        [reservationId, id_equipement, quantite]
      );
    }
    
    // Create notification for the user
    await connection.execute(
      'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), ?)',
      [
        id_utilisateur,
        'Your reservation request has been received and is pending approval.',
        'envoye'
      ]
    );
    
    await connection.commit();
    
    res.status(201).json({
      id: reservationId,
      message: 'Batch reservation created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating batch reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id
// @access  Private
const updateReservationStatus = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { statut } = req.body;
    
    if (!statut) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate the status is one of the allowed ENUM values
    if (!['attente', 'validee', 'refusee'].includes(statut)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Get ALL equipment items associated with this reservation
    const [reservationItems] = await connection.execute(
      `SELECT r.id, r.id_utilisateur, re.id_equipement, re.quantite_reservee, 
              e.categorie, u.nom as nom_utilisateur, u.prenom as prenom_utilisateur
       FROM Reservation r
       JOIN Reservation_Equipement re ON r.id = re.id_reservation
       JOIN Equipement e ON re.id_equipement = e.id
       JOIN Utilisateur u ON r.id_utilisateur = u.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (reservationItems.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Update reservation status
    await connection.execute(
      'UPDATE Reservation SET etat = ? WHERE id = ?',
      [statut, id]
    );
    
    // Get the user ID for notifications
    const userId = reservationItems[0].id_utilisateur;
    
    // Handle equipment status and quantity based on reservation status
    if (statut === 'validee') {
      // Process each equipment item in this reservation
      for (const item of reservationItems) {
        if (item.categorie === 'solo') {
          // Update solo equipment status
          console.log(`Updating solo equipment ${item.id_equipement} to en_cours`);
          await connection.execute(
            'UPDATE Solo SET etat = "en_cours" WHERE id = ?',
            [item.id_equipement]
          );
        } else if (item.categorie === 'stockable') {
          // Update stockable equipment quantity
          console.log(`Updating stockable equipment ${item.id_equipement} quantity by ${item.quantite_reservee}`);
          await connection.execute(
            'UPDATE Equipement SET quantite = quantite - ? WHERE id = ?',
            [item.quantite_reservee, item.id_equipement]
          );
        }
      }
      
      // Create approval notification
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [userId, `Your reservation #${id} has been approved.`]
      );
    } else if (statut === 'refusee') {
      // Create rejection notification
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [userId, `Your reservation #${id} has been rejected.`]
      );
    }
    
    await connection.commit();
    
    res.json({
      id,
      message: `Reservation status updated to ${statut}`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating reservation status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Get reservation details before deleting
    const [reservation] = await connection.execute(
      `SELECT r.*, re.id_equipement, re.quantite_reservee, e.categorie
       FROM Reservation r
       JOIN Reservation_Equipement re ON r.id = re.id_reservation
       JOIN Equipement e ON re.id_equipement = e.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (reservation.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    const reservationDetails = reservation[0];
    
    // If the reservation was confirmed, update equipment accordingly
    if (reservationDetails.etat === 'validee') {
      if (reservationDetails.categorie === 'solo') {
        // Update solo equipment status back to available
        await connection.execute(
          'UPDATE Solo SET etat = "disponible" WHERE id = ?',
          [reservationDetails.id_equipement]
        );
      } else if (reservationDetails.categorie === 'stockable') {
        // Return the quantity back to stock
        await connection.execute(
          'UPDATE Equipement SET quantite = quantite + ? WHERE id = ?',
          [reservationDetails.quantite_reservee, reservationDetails.id_equipement]
        );
      }
    }
    
    // Delete from Reservation_Equipement first due to foreign key constraint
    await connection.execute(
      'DELETE FROM Reservation_Equipement WHERE id_reservation = ?',
      [id]
    );
    
    // Delete the reservation
    await connection.execute(
      'DELETE FROM Reservation WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get pending reservations (for responsible/admin users)
// @route   GET /api/reservations/pending
// @access  Private (Admin/Responsible)
const getPendingReservations = async (req, res) => {
  try {
    const [reservations] = await pool.execute(
      `SELECT r.id as id_reservation, r.date_debut, r.date_fin, r.etat as statut, 
              r.id_utilisateur, e.id as id_equipement, e.nom as nom_equipement,
              u.nom as nom_utilisateur, u.prenom as prenom_utilisateur,
              re.quantite_reservee
       FROM Reservation r
       JOIN Reservation_Equipement re ON r.id = re.id_reservation
       JOIN Equipement e ON re.id_equipement = e.id
       JOIN Utilisateur u ON r.id_utilisateur = u.id
       WHERE r.etat = 'attente'
       ORDER BY r.date_debut ASC`
    );
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching pending reservations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  createBatchReservation,
  updateReservationStatus,
  deleteReservation,
  getPendingReservations
};