const { pool } = require('../config/dbConfig');

// @desc    Obtenir tous les équipements
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
    console.error('Erreur lors de la récupération des équipements:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Obtenir un équipement par ID
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
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }

    res.json(equipment[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Créer un nouvel équipement
// @route   POST /api/equipments
// @access  Privé
const createEquipment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { nom, description, categorie, quantite, etat, qr_code } = req.body;

    // Insertion dans la table principale Equipement
    const [result] = await connection.execute(
      'INSERT INTO Equipement (nom, description, categorie, quantite) VALUES (?, ?, ?, ?)',
      [nom, description, categorie, quantite]
    );

    const equipmentId = result.insertId;

    // Insertion dans la table spécifique selon le type
    if (categorie === 'solo') {
      await connection.execute(
        'INSERT INTO Solo (id, etat) VALUES (?, ?)',
        [equipmentId, etat || 'disponible']  // Utiliser la valeur ENUM directement, par défaut 'disponible'
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
      message: 'Équipement ajouté avec succès'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de l\'ajout de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Mettre à jour un équipement
// @route   PUT /api/equipments/:id
// @access  Privé
const updateEquipment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nom, description, categorie, quantite, etat, qr_code, previousStatus, technicianId, technicianName } = req.body;

    // Vérifier si l'équipement existe
    const [existing] = await connection.execute(
      'SELECT * FROM Equipement WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }

    // Mise à jour de la table principale Equipement
    await connection.execute(
      'UPDATE Equipement SET nom = ?, description = ?, quantite = ? WHERE id = ?',
      [nom, description, quantite, id]
    );

    // Mise à jour de la table spécifique selon la catégorie
    if (categorie === 'solo') {
      const [soloCheck] = await connection.execute(
        'SELECT * FROM Solo WHERE id = ?',
        [id]
      );

      if (soloCheck.length > 0) {
        await connection.execute(
          'UPDATE Solo SET etat = ? WHERE id = ?',
          [etat || 'disponible', id]  // Utiliser la valeur ENUM directement
        );
      } else {
        // Gérer le changement de type si nécessaire
        await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);
        await connection.execute(
          'INSERT INTO Solo (id, etat) VALUES (?, ?)',
          [id, etat || 'disponible']  // Utiliser la valeur ENUM directement
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
        // Gérer le changement de type si nécessaire
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

    // Récupération des détails de l'équipement
    const [equipResult] = await connection.execute(
      'SELECT nom FROM Equipement WHERE id = ?',
      [id]
    );
    const equipmentName = equipResult[0]?.nom || `Équipement #${id}`;

    // Création de notifications basées sur les transitions d'état
    if (previousStatus === 'disponible' && etat === 'indisponible') {
      // De disponible à indisponible
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} est marqué comme indisponible`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${technicianName} a marqué ${equipmentName} #${id} comme indisponible`]
        );
      }
    }
    else if (previousStatus === 'indisponible' && etat === 'en_reparation') {
      // D'indisponible à en réparation
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} est maintenant en réparation`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${technicianName} est en train de réparer ${equipmentName} #${id}`]
        );
      }
    }
    else if (previousStatus === 'en_reparation' && etat === 'disponible') {
      // De en réparation à disponible
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} a été réparé et est maintenant disponible`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${technicianName} a réparé ${equipmentName} #${id}`]
        );
      }
    }

    await connection.commit();

    res.json({
      id,
      message: 'Équipement mis à jour avec succès'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la mise à jour de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Supprimer un équipement
// @route   DELETE /api/equipments/:id
// @access  Privé
const deleteEquipment = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Vérifier s'il existe des réservations
    const [reservations] = await connection.execute(
      'SELECT * FROM Reservation_Equipement WHERE id_equipement = ?',
      [id]
    );

    if (reservations.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Impossible de supprimer un équipement qui a des réservations'
      });
    }

    // Suppression des tables spécifiques d'abord (en raison des contraintes de clé étrangère)
    await connection.execute('DELETE FROM Solo WHERE id = ?', [id]);
    await connection.execute('DELETE FROM Stockable WHERE id = ?', [id]);

    // Puis suppression de la table principale
    await connection.execute('DELETE FROM Equipement WHERE id = ?', [id]);

    await connection.commit();

    res.json({ message: 'Équipement supprimé avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la suppression de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Obtenir les équipements stockables
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
    console.error('Erreur lors de la récupération des équipements stockables:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Obtenir les équipements solo
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
    console.error('Erreur lors de la récupération des équipements solo:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Mettre à jour l'état d'un équipement
// @route   PATCH /api/equipments/:id/status
// @access  Privé
const updateEquipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { etat } = req.body;

    if (!etat) {
      return res.status(400).json({ message: 'L\'état est requis' });
    }

    // Valider que l'état est l'une des valeurs ENUM autorisées
    if (!['disponible', 'en_cours', 'indisponible', 'en_reparation'].includes(etat)) {
      return res.status(400).json({ message: 'Valeur d\'état invalide' });
    }

    const [result] = await pool.execute(
      'UPDATE Solo SET etat = ? WHERE id = ?',
      [etat, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Équipement non trouvé ou pas de type Solo' });
    }

    res.json({ message: 'État de l\'équipement mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'état de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Mettre à jour l'état d'un équipement avec notifications
// @route   PATCH /api/equipments/:id
// @access  Privé
const updateEquipmentState = async (req, res) => {
  const { id } = req.params;
  const { etat: newState, oldState, technicianId, technicianName } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Mise à jour de l'état de l'équipement dans la base de données
    await connection.execute(
      'UPDATE Solo SET etat = ? WHERE id = ?',
      [newState, id]
    );

    // Récupération des détails de l'équipement
    const [equipment] = await connection.execute(
      'SELECT nom FROM Equipement WHERE id = ?',
      [id]
    );

    if (equipment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }

    const equipmentName = equipment[0].nom;

    // Récupération des détails du technicien si non fournis
    let techFullName = technicianName;
    if (!techFullName && technicianId) {
      const [techDetails] = await connection.execute(
        'SELECT nom, prenom FROM Utilisateur WHERE id = ?',
        [technicianId]
      );

      if (techDetails.length > 0) {
        techFullName = `${techDetails[0].prenom} ${techDetails[0].nom}`;
      } else {
        techFullName = 'Un technicien';
      }
    }

    // Gestion des transitions d'état pour les notifications
    if (oldState === 'disponible' && newState === 'indisponible') {
      // Notification au technicien
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} est maintenant indisponible`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${techFullName} a marqué ${equipmentName} #${id} comme indisponible`]
        );
      }
    }
    else if (oldState === 'indisponible' && newState === 'en_reparation') {
      // Notification au technicien
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} est maintenant en réparation`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${techFullName} est en train de réparer ${equipmentName} #${id}`]
        );
      }
    }
    else if (oldState === 'en_reparation' && newState === 'disponible') {
      // Notification au technicien
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [technicianId, `${equipmentName} #${id} a été réparé`]
      );

      // Notification aux responsables
      const [responsables] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "responsable"'
      );

      for (const resp of responsables) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [resp.id, `${techFullName} a réparé ${equipmentName} #${id}`]
        );
      }
    }

    await connection.commit();

    res.json({
      message: `État de l'équipement changé de ${oldState} à ${newState}`,
      equipment: {
        id,
        name: equipmentName,
        state: newState
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la mise à jour de l\'état de l\'équipement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  updateEquipmentStatus,
  deleteEquipment,
  getStockableEquipment,
  getSoloEquipment,
  updateEquipmentState
};