const mysql = require('mysql2/promise');
require('dotenv-flow').config();

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

// @desc    Get all equipment
// @route   GET /api/equipments
// @access  Private
const getEquipments = async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = `
      SELECT 
        e.id AS id_equipement,
        e.nom,
        e.description,
        e.categorie AS catégorie,
        CASE
          WHEN e.categorie = 'stockable' THEN 'disponible'
          WHEN e.categorie = 'unique' AND u.etat = TRUE THEN 'disponible'
          ELSE 'hors_service'
        END AS état,
        COALESCE(s.quantite, 1) AS quantite_dispo
      FROM Equipement e
      LEFT JOIN Stockable s ON e.id = s.id
      LEFT JOIN \`Unique\` u ON e.id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (category && category !== 'all') {
      query += ' AND e.categorie = ?';
      queryParams.push(category);
    }

    if (status && status !== 'all') {
      if (status === 'disponible') {
        query += ' AND (e.categorie = "stockable" OR (e.categorie = "unique" AND u.etat = TRUE))';
      } else if (status === 'hors_service') {
        query += ' AND (e.categorie = "unique" AND u.etat = FALSE)';
      }
    }

    query += ' ORDER BY e.id';
    
    const [equipments] = await pool.execute(query, queryParams);
    
    res.status(200).json(equipments);
  } catch (error) {
    console.error('Error getting equipments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single equipment
// @route   GET /api/equipments/:id
// @access  Private
const getEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [equipment] = await pool.execute(`
      SELECT 
        e.id AS id_equipement,
        e.nom,
        e.description,
        e.categorie AS catégorie,
        CASE
          WHEN e.categorie = 'stockable' THEN 'disponible'
          WHEN e.categorie = 'unique' AND u.etat = TRUE THEN 'disponible'
          ELSE 'hors_service'
        END AS état,
        COALESCE(s.quantite, 1) AS quantite_dispo
      FROM Equipement e
      LEFT JOIN Stockable s ON e.id = s.id
      LEFT JOIN \`Unique\` u ON e.id = u.id
      WHERE e.id = ?
    `, [id]);

    if (equipment.length === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.status(200).json(equipment[0]);
  } catch (error) {
    console.error('Error getting equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add equipment
// @route   POST /api/equipments
// @access  Private/Admin
const addEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { nom, description, categorie = 'stockable', quantite = 1, etat = true } = req.body;
    
    const [result] = await connection.execute(
      'INSERT INTO Equipement (nom, description, categorie, quantite) VALUES (?, ?, ?, ?)',
      [nom, description, categorie, quantite]
    );

    const equipmentId = result.insertId;

    // Based on category, insert into appropriate subtable
    if (categorie === 'stockable') {
      await connection.execute(
        'INSERT INTO Stockable (id, quantite) VALUES (?, ?)',
        [equipmentId, quantite]
      );
    } else if (categorie === 'unique') {
      await connection.execute(
        'INSERT INTO `Unique` (id, etat) VALUES (?, ?)',
        [equipmentId, etat]
      );
    }

    await connection.commit();
    
    res.status(201).json({ 
      message: 'Equipment added successfully',
      id: equipmentId
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
// @access  Private/Admin
const updateEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { nom, description, categorie, quantite, etat } = req.body;
    
    // First check if equipment exists
    const [existing] = await connection.execute(
      'SELECT * FROM Equipement WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const currentCategory = existing[0].categorie;
    
    // Update the main equipment table
    await connection.execute(
      'UPDATE Equipement SET nom = ?, description = ?, categorie = ?, quantite = ? WHERE id = ?',
      [nom, description, categorie, quantite, id]
    );

    // Handle the subtype tables
    if (categorie === 'stockable') {
      // If it was already stockable, just update
      if (currentCategory === 'stockable') {
        await connection.execute(
          'UPDATE Stockable SET quantite = ? WHERE id = ?',
          [quantite, id]
        );
      } else {
        // It's changing from unique to stockable
        await connection.execute('DELETE FROM `Unique` WHERE id = ?', [id]);
        await connection.execute(
          'INSERT INTO Stockable (id, quantite) VALUES (?, ?)',
          [id, quantite]
        );
      }
    } else if (categorie === 'unique') {
      // If it was already unique, just update
      if (currentCategory === 'unique') {
        await connection.execute(
          'UPDATE `Unique` SET etat = ? WHERE id = ?',
          [etat === 'disponible', id]
        );
      } else {
        // It's changing from stockable to unique
        await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);
        await connection.execute(
          'INSERT INTO `Unique` (id, etat) VALUES (?, ?)',
          [id, etat === 'disponible']
        );
      }
    }

    await connection.commit();
    
    res.status(200).json({ message: 'Equipment updated successfully' });
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
// @access  Private/Admin
const deleteEquipment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Check if equipment exists
    const [existing] = await connection.execute(
      'SELECT categorie FROM Equipement WHERE id = ?', 
      [id]
    );
    
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const categorie = existing[0].categorie;
    
    // Delete from proper subtype table first
    if (categorie === 'stockable') {
      await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);
    } else if (categorie === 'unique') {
      await connection.execute('DELETE FROM `Unique` WHERE id = ?', [id]);
    }
    
    // Delete from main equipment table
    await connection.execute('DELETE FROM Equipement WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting equipment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getEquipments,
  getEquipment,
  addEquipment,
  updateEquipment,
  deleteEquipment
};