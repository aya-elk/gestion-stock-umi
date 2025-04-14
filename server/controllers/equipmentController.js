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

// @desc    Get all equipment
// @route   GET /api/equipments
// @access  Public
const getAllEquipment = async (req, res) => {
  try {
    const { category, status, available } = req.query;
    
    let query = `
      SELECT e.id, e.nom, e.description, e.categorie, e.quantite,
             s.etat,
             CASE WHEN st.qr_code IS NOT NULL THEN st.qr_code ELSE NULL END as qr_code
      FROM Equipement e
      LEFT JOIN Solo s ON e.id = s.id
      LEFT JOIN Stockable st ON e.id = st.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('e.categorie = ?');
      params.push(category);
    }
    
    if (status) {
      conditions.push('s.etat = ?');
      params.push(status);
    }
    
    if (available === 'true') {
      conditions.push('(e.categorie = "stockable" AND e.quantite > 0) OR (e.categorie = "solo" AND s.etat = "disponible")');
    }
    
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const [equipment] = await pool.execute(query, params);
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get equipment by ID
// @route   GET /api/equipments/:id
// @access  Public
const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [equipment] = await pool.execute(
      `SELECT e.id, e.nom, e.description, e.categorie, e.quantite,
              CASE WHEN s.id IS NOT NULL THEN s.etat ELSE NULL END as etat,
              CASE WHEN st.id IS NOT NULL THEN st.qr_code ELSE NULL END as qr_code
       FROM Equipement e
       LEFT JOIN Solo s ON e.id = s.id
       LEFT JOIN Stockable st ON e.id = st.id
       WHERE e.id = ?`,
      [id]
    );
    
    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(equipment[0]);
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new equipment
// @route   POST /api/equipments
// @access  Private
const createEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { nom, description, categorie, quantite, etat, qr_code } = req.body;
    
    // Insert into main Equipement table first
    const [result] = await connection.execute(
      'INSERT INTO Equipement (nom, description, categorie, quantite) VALUES (?, ?, ?, ?)',
      [nom, description, categorie, quantite]
    );
    
    const equipmentId = result.insertId;
    
    // Insert into specific type table
    if (categorie === 'solo') {
      await connection.execute(
        'INSERT INTO Solo (id, etat) VALUES (?, ?)',
        [equipmentId, etat || 'disponible']  // Use ENUM value directly, default to 'disponible'
      );
    } else if (categorie === 'stockable') {
      await connection.execute(
        'INSERT INTO Stockable (id, quantite, qr_code) VALUES (?, ?, ?)',
        [equipmentId, quantite, qr_code || null]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      id: equipmentId,
      nom,
      description,
      categorie,
      quantite,
      etat,
      message: 'Equipment added successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Update equipment
// @route   PUT /api/equipments/:id
// @access  Private
const updateEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { nom, description, categorie, quantite, etat, qr_code } = req.body;
    
    // Check if equipment exists
    const [existing] = await connection.execute(
      'SELECT * FROM Equipement WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Update main Equipement table
    await connection.execute(
      'UPDATE Equipement SET nom = ?, description = ?, quantite = ? WHERE id = ?',
      [nom, description, quantite, id]
    );
    
    // Update specific type table based on category
    if (categorie === 'solo') {
      const [soloCheck] = await connection.execute(
        'SELECT * FROM Solo WHERE id = ?',
        [id]
      );
      
      if (soloCheck.length > 0) {
        await connection.execute(
          'UPDATE Solo SET etat = ? WHERE id = ?',
          [etat || 'disponible', id]  // Use ENUM value directly
        );
      } else {
        // Handle type change if needed
        await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);
        await connection.execute(
          'INSERT INTO Solo (id, etat) VALUES (?, ?)',
          [id, etat || 'disponible']  // Use ENUM value directly
        );
        await connection.execute(
          'UPDATE Equipement SET categorie = "solo" WHERE id = ?',
          [id]
        );
      }
    } else if (categorie === 'stockable') {
      const [stockableCheck] = await connection.execute(
        'SELECT * FROM Stockable WHERE id = ?',
        [id]
      );
      
      if (stockableCheck.length > 0) {
        await connection.execute(
          'UPDATE Stockable SET quantite = ?, qr_code = ? WHERE id = ?',
          [quantite, qr_code || null, id]
        );
      } else {
        // Handle type change if needed
        await connection.execute('DELETE FROM Solo WHERE id = ?', [id]);
        await connection.execute(
          'INSERT INTO Stockable (id, quantite, qr_code) VALUES (?, ?, ?)',
          [id, quantite, qr_code || null]
        );
        await connection.execute(
          'UPDATE Equipement SET categorie = "stockable" WHERE id = ?',
          [id]
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      id,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipments/:id
// @access  Private
const deleteEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check for reservations
    const [reservations] = await connection.execute(
      'SELECT * FROM Reservation_Equipement WHERE id_equipement = ?',
      [id]
    );
    
    if (reservations.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Cannot delete equipment that has reservations' 
      });
    }
    
    // Delete from specific type tables first (due to foreign key constraints)
    await connection.execute('DELETE FROM Solo WHERE id = ?', [id]);
    await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);
    
    // Then delete from main table
    await connection.execute('DELETE FROM Equipement WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Get stockable equipment
// @route   GET /api/equipments/stockable
// @access  Public
const getStockableEquipment = async (req, res) => {
  try {
    const [equipment] = await pool.execute(`
      SELECT e.id, e.nom, e.description, e.categorie, 
             st.quantite, st.qr_code
      FROM Equipement e
      JOIN Stockable st ON e.id = st.id
      WHERE e.categorie = 'stockable'
    `);
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching stockable equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get solo equipment
// @route   GET /api/equipments/solo
// @access  Public
const getSoloEquipment = async (req, res) => {
  try {
    const [equipment] = await pool.execute(`
      SELECT e.id, e.nom, e.description, e.categorie, s.etat
      FROM Equipement e
      JOIN Solo s ON e.id = s.id
      WHERE e.categorie = 'solo'
    `);
    
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching solo equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update equipment status
// @route   PATCH /api/equipments/:id/status
// @access  Private
const updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat } = req.body;
    
    if (!etat) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate the status is one of the allowed ENUM values
    // Update this line to include 'en_reparation'
    if (!['disponible', 'en_cours', 'indisponible', 'en_reparation'].includes(etat)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const [result] = await pool.execute(
      'UPDATE Solo SET etat = ? WHERE id = ?',
      [etat, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Equipment not found or not of type Solo' });
    }
    
    res.json({ message: 'Equipment status updated successfully' });
  } catch (error) {
    console.error('Error updating equipment status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  updateEquipmentStatus, // Add this new function
  deleteEquipment,
  getStockableEquipment,
  getSoloEquipment
};