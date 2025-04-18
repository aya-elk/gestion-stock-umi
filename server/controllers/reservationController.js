const { pool } = require('../config/dbConfig');
const { sendEmail } = require('../utilities/mailer');
const { generateReservationEmail } = require('../utilities/templates/reservationEmail');
const { generateReservationStatusEmail } = require('../utilities/templates/reservationStatusEmail');

// @desc    Récupérer toutes les réservations
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

    // Toujours trier par date, les plus récentes d'abord
    query += ' ORDER BY r.date_debut DESC';

    // Ajouter une limite si spécifiée
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const [reservations] = await pool.execute(query, params);
    res.json(reservations);
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Récupérer une réservation par ID
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
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Créer une nouvelle réservation
// @route   POST /api/reservations
// @access  Private
const createReservation = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id_utilisateur, id_equipement, date_debut, date_fin, quantite, statut } = req.body;

    // Valider les champs requis
    if (!id_utilisateur || !id_equipement || !date_debut || !date_fin) {
      return res.status(400).json({ message: 'ID utilisateur, ID équipement, date de début et date de fin sont obligatoires' });
    }

    // Vérifier si l'équipement existe et est disponible
    const [equipment] = await connection.execute(
      'SELECT * FROM Equipement e LEFT JOIN Solo s ON e.id = s.id WHERE e.id = ?',
      [id_equipement]
    );

    if (equipment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }

    const equip = equipment[0];
    // Pour un équipement solo, vérifier s'il est disponible
    if (equip.categorie === 'solo' && equip.etat !== 'disponible') {
      await connection.rollback();
      return res.status(400).json({ message: 'L\'équipement n\'est pas disponible pour la réservation' });
    }

    // Pour un équipement stockable, vérifier la quantité
    if (equip.categorie === 'stockable' && (equip.quantite < quantite || equip.quantite <= 0)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Pas assez d\'articles disponibles' });
    }

    // Insertion dans la table Reservation
    const [result] = await connection.execute(
      'INSERT INTO Reservation (date_debut, date_fin, etat, id_utilisateur) VALUES (?, ?, ?, ?)',
      [date_debut, date_fin, statut || 'attente', id_utilisateur]
    );

    const reservationId = result.insertId;

    // Insertion dans la table Reservation_Equipement
    await connection.execute(
      'INSERT INTO Reservation_Equipement (id_reservation, id_equipement, quantite_reservee) VALUES (?, ?, ?)',
      [reservationId, id_equipement, quantite || 1]
    );

    // Si équipement solo, mettre à jour son statut à 'en_cours' si la réservation est confirmée
    if (equip.categorie === 'solo' && statut === 'validee') {
      await connection.execute(
        'UPDATE Solo SET etat = "en_cours" WHERE id = ?',
        [id_equipement]
      );
    }

    // Si équipement stockable et réservation confirmée, diminuer la quantité disponible
    if (equip.categorie === 'stockable' && statut === 'validee') {
      await connection.execute(
        'UPDATE Equipement SET quantite = quantite - ? WHERE id = ?',
        [quantite || 1, id_equipement]
      );
    }

    await connection.commit();

    // Créer une notification pour l'utilisateur
    try {
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [id_utilisateur, `Votre réservation pour ${equip.nom} a été soumise et est en attente d'approbation.`]
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas échouer la requête en raison d'une erreur de notification
    }

    // Obtenir l'email de l'étudiant pour envoyer la confirmation
    const [userDetails] = await connection.execute(
      'SELECT email, nom, prenom FROM Utilisateur WHERE id = ?',
      [id_utilisateur]
    );

    if (userDetails.length > 0) {
      const studentEmail = userDetails[0].email;
      const studentFullName = `${userDetails[0].prenom} ${userDetails[0].nom}`;

      // Générer le contenu de l'email
      const emailContent = generateReservationEmail({
        studentName: studentFullName,
        reservationId: reservationId,
        equipment: [{
          name: equip.nom || `Équipement #${id_equipement}`,
          quantity: quantite || 1
        }],
        startDate: date_debut,
        endDate: date_fin
      });

      // Envoyer l'email de confirmation
      try {
        await sendEmail({
          to: studentEmail,
          subject: `Confirmation de Réservation d'Équipement #${reservationId}`,
          text: `Votre réservation #${reservationId} a été soumise et est en attente d'approbation.`,
          html: emailContent
        });
        console.log(`Email de confirmation envoyé à ${studentEmail}`);
      } catch (emailError) {
        console.error('Échec de l\'envoi de l\'email de confirmation:', emailError);
        // Ne pas arrêter le processus si l'envoi d'email échoue
      }
    }

    res.status(201).json({
      id: reservationId,
      message: 'Réservation créée avec succès'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Créer une réservation groupée avec plusieurs équipements
// @route   POST /api/reservations/batch
// @access  Private
const createBatchReservation = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id_utilisateur, date_debut, date_fin, items } = req.body;

    // Valider les champs requis
    if (!id_utilisateur || !date_debut || !date_fin || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Données de requête invalides' });
    }

    // Créer une entrée unique de réservation
    const [result] = await connection.execute(
      'INSERT INTO Reservation (date_debut, date_fin, etat, id_utilisateur) VALUES (?, ?, ?, ?)',
      [date_debut, date_fin, 'attente', id_utilisateur]
    );

    const reservationId = result.insertId;

    // Ajouter tous les équipements à la réservation
    for (const item of items) {
      const { id_equipement, quantite } = item;

      // Vérifier si l'équipement existe et est disponible
      const [equipment] = await connection.execute(
        'SELECT * FROM Equipement e LEFT JOIN Solo s ON e.id = s.id WHERE e.id = ?',
        [id_equipement]
      );

      if (equipment.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Équipement ID ${id_equipement} non trouvé` });
      }

      const equip = equipment[0];

      // Pour un équipement solo, vérifier s'il est disponible
      if (equip.categorie === 'solo' && equip.etat !== 'disponible') {
        await connection.rollback();
        return res.status(400).json({ message: `L'équipement ${equip.nom} n'est pas disponible pour la réservation` });
      }

      // Pour un équipement stockable, vérifier la quantité
      if (equip.categorie === 'stockable' && (equip.quantite < quantite || equip.quantite <= 0)) {
        await connection.rollback();
        return res.status(400).json({ message: `Pas assez de ${equip.nom} disponible` });
      }

      // Insertion dans la table Reservation_Equipement
      await connection.execute(
        'INSERT INTO Reservation_Equipement (id_reservation, id_equipement, quantite_reservee) VALUES (?, ?, ?)',
        [reservationId, id_equipement, quantite]
      );
    }

    // D'abord récupérer les noms des équipements pour tous les articles demandés
    const equipmentItems = await Promise.all(items.map(async (item) => {
      const [equipResult] = await connection.execute(
        'SELECT nom FROM Equipement WHERE id = ?',
        [item.id_equipement]
      );
      return {
        ...item,
        equipmentName: equipResult[0]?.nom || `Équipement #${item.id_equipement}`
      };
    }));

    // Notification actuelle à l'étudiant (à améliorer)
    await connection.execute(
      'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), ?)',
      [
        id_utilisateur,
        `Votre demande de réservation pour ${equipmentItems.map(item =>
          `${item.equipmentName}${item.quantite > 1 ? ` (x${item.quantite})` : ''}`
        ).join(', ')} a été reçue et est en attente d'approbation.`,
        'envoye'
      ]
    );

    // Obtenir le nom complet de l'étudiant
    const [studentDetails] = await connection.execute(
      'SELECT nom, prenom FROM Utilisateur WHERE id = ?',
      [id_utilisateur]
    );

    const studentFullName = `${studentDetails[0].prenom} ${studentDetails[0].nom}`;

    // Obtenir tous les responsables
    const [responsables] = await connection.execute(
      'SELECT id FROM Utilisateur WHERE role = "responsable"'
    );

    // Créer une notification pour tous les responsables
    for (const responsable of responsables) {
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [
          responsable.id,
          `L'étudiant ${studentFullName} a demandé ${equipmentItems.map(item =>
            `${item.equipmentName}${item.quantite > 1 ? ` (x${item.quantite})` : ''}`
          ).join(', ')} sous la réservation #${reservationId}.`,
        ]
      );
    }

    // Obtenir l'email de l'étudiant pour envoyer la confirmation
    const [userDetails] = await connection.execute(
      'SELECT email, nom, prenom FROM Utilisateur WHERE id = ?',
      [id_utilisateur]
    );

    if (userDetails.length > 0) {
      const studentEmail = userDetails[0].email;
      const studentFullName = `${userDetails[0].prenom} ${userDetails[0].nom}`;

      // Formater les équipements pour l'email
      const equipmentItems = await Promise.all(items.map(async (item) => {
        const [equipResult] = await connection.execute(
          'SELECT nom FROM Equipement WHERE id = ?',
          [item.id_equipement]
        );
        return {
          name: equipResult[0]?.nom || `Équipement #${item.id_equipement}`,
          quantity: item.quantite || 1
        };
      }));

      // Générer le contenu de l'email
      const emailContent = generateReservationEmail({
        studentName: studentFullName,
        reservationId: reservationId,
        equipment: equipmentItems,
        startDate: date_debut,
        endDate: date_fin
      });

      // Envoyer l'email de confirmation
      try {
        await sendEmail({
          to: studentEmail,
          subject: `Confirmation de Réservation d'Équipement #${reservationId}`,
          text: `Votre réservation #${reservationId} a été soumise et est en attente d'approbation.`,
          html: emailContent
        });
        console.log(`Email de confirmation envoyé à ${studentEmail}`);
      } catch (emailError) {
        console.error('Échec de l\'envoi de l\'email de confirmation:', emailError);
        // Ne pas arrêter le processus si l'envoi d'email échoue
      }
    }

    await connection.commit();

    res.status(201).json({
      id: reservationId,
      message: 'Réservation groupée créée avec succès'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création de la réservation groupée:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Mettre à jour le statut de la réservation
// @route   PATCH /api/reservations/:id
// @access  Private
const updateReservationStatus = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { statut, responsable_id } = req.body; // Ajouter responsable_id au corps de la requête

    if (!statut) {
      return res.status(400).json({ message: 'Le statut est requis' });
    }

    // Valider que le statut est l'une des valeurs ENUM autorisées
    if (!['attente', 'validee', 'refusee'].includes(statut)) {
      return res.status(400).json({ message: 'Valeur de statut invalide' });
    }

    // Obtenir TOUS les équipements associés à cette réservation avec les noms des équipements
    const [reservationItems] = await connection.execute(
      `SELECT r.id, r.id_utilisateur, r.date_debut, r.date_fin, re.id_equipement, re.quantite_reservee, 
              e.categorie, e.nom, u.nom as nom_utilisateur, u.prenom as prenom_utilisateur, u.email as email_utilisateur
       FROM Reservation r
       JOIN Reservation_Equipement re ON r.id = re.id_reservation
       JOIN Equipement e ON re.id_equipement = e.id
       JOIN Utilisateur u ON r.id_utilisateur = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reservationItems.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Mettre à jour le statut de la réservation
    await connection.execute(
      'UPDATE Reservation SET etat = ? WHERE id = ?',
      [statut, id]
    );

    // Obtenir l'ID de l'utilisateur pour les notifications
    const userId = reservationItems[0].id_utilisateur;
    const studentEmail = reservationItems[0].email_utilisateur;

    // Obtenir l'ID du responsable - soit du corps de la requête, req.user, ou utiliser une valeur par défaut
    const respId = responsable_id || (req.user ? req.user.id : null);

    // Formater la liste d'équipements pour les notifications
    const equipmentList = reservationItems.map(item =>
      `${item.nom}${item.quantite_reservee > 1 ? ` (x${item.quantite_reservee})` : ''}`
    ).join(', ');

    // Obtenir le nom complet de l'étudiant
    const studentFullName = `${reservationItems[0].prenom_utilisateur} ${reservationItems[0].nom_utilisateur}`;

    let responsableFullName = "Un responsable gestionnaire";
    let responsableEmail = null;

    // Obtenir le nom du responsable si on a l'ID
    if (respId) {
      const [responsableDetails] = await connection.execute(
        'SELECT nom, prenom, email FROM Utilisateur WHERE id = ?',
        [respId]
      );

      if (responsableDetails.length > 0) {
        responsableFullName = `${responsableDetails[0].prenom} ${responsableDetails[0].nom}`;
        responsableEmail = responsableDetails[0].email;
      }
    }

    // Formater les éléments d'équipement pour l'email
    const equipmentItems = reservationItems.map(item => ({
      name: item.nom || `Équipement #${item.id_equipement}`,
      quantity: item.quantite_reservee || 1
    }));

    // Gérer le statut de l'équipement et la quantité en fonction du statut de la réservation
    if (statut === 'validee') {
      // Traiter chaque équipement dans cette réservation
      for (const item of reservationItems) {
        if (item.categorie === 'solo') {
          // Mettre à jour le statut de l'équipement solo
          console.log(`Mise à jour de l'équipement solo ${item.id_equipement} à en_cours`);
          await connection.execute(
            'UPDATE Solo SET etat = "en_cours" WHERE id = ?',
            [item.id_equipement]
          );
        } else if (item.categorie === 'stockable') {
          // Mettre à jour la quantité d'équipement stockable
          console.log(`Mise à jour de la quantité d'équipement stockable ${item.id_equipement} de ${item.quantite_reservee}`);
          await connection.execute(
            'UPDATE Equipement SET quantite = quantite - ? WHERE id = ?',
            [item.quantite_reservee, item.id_equipement]
          );
        }
      }

      // 1. Créer une notification pour l'étudiant
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [
          userId,
          `${responsableFullName} a accepté votre réservation #${id} de ${equipmentList}.`
        ]
      );

      // 2. Créer une notification pour le responsable
      if (respId) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [
            respId,
            `Vous avez accepté la réservation #${id} de ${studentFullName} pour ${equipmentList}.`
          ]
        );
      }

      // 3. Notifier les techniciens
      const [technicians] = await connection.execute(
        'SELECT id FROM Utilisateur WHERE role = "technicien"'
      );

      for (const tech of technicians) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [
            tech.id,
            `Le responsable ${responsableFullName} a approuvé l'équipement ${equipmentList} pour l'étudiant ${studentFullName}. Veuillez l'assister.`
          ]
        );
      }

      // 4. Envoyer des emails d'approbation à l'étudiant et au responsable
      if (studentEmail) {
        // Générer l'email pour l'étudiant
        const studentEmailContent = generateReservationStatusEmail({
          recipientName: studentFullName,
          studentName: studentFullName,
          responsableName: responsableFullName,
          reservationId: id,
          equipment: equipmentItems,
          startDate: reservationItems[0].date_debut,
          endDate: reservationItems[0].date_fin,
          status: 'validee',
          isResponsable: false
        });

        // Envoyer l'email à l'étudiant
        try {
          await sendEmail({
            to: studentEmail,
            subject: `Réservation d'Équipement #${id} Approuvée`,
            text: `Votre réservation #${id} pour ${equipmentList} a été approuvée par ${responsableFullName}.`,
            html: studentEmailContent
          });
          console.log(`Email d'approbation envoyé à l'étudiant: ${studentEmail}`);
        } catch (emailError) {
          console.error('Échec de l\'envoi de l\'email d\'approbation à l\'étudiant:', emailError);
          // Ne pas arrêter le processus si l'envoi d'email échoue
        }
      }

      // Envoyer un email de confirmation au responsable
      if (responsableEmail) {
        // Générer l'email pour le responsable
        const responsableEmailContent = generateReservationStatusEmail({
          recipientName: responsableFullName,
          studentName: studentFullName,
          responsableName: responsableFullName,
          reservationId: id,
          equipment: equipmentItems,
          startDate: reservationItems[0].date_debut,
          endDate: reservationItems[0].date_fin,
          status: 'validee',
          isResponsable: true
        });

        // Envoyer l'email au responsable
        try {
          await sendEmail({
            to: responsableEmail,
            subject: `Confirmation d'Approbation de Réservation #${id}`,
            text: `Vous avez approuvé la réservation #${id} pour ${equipmentList} demandée par ${studentFullName}.`,
            html: responsableEmailContent
          });
          console.log(`Email de confirmation envoyé au responsable: ${responsableEmail}`);
        } catch (emailError) {
          console.error('Échec de l\'envoi de l\'email de confirmation au responsable:', emailError);
          // Ne pas arrêter le processus si l'envoi d'email échoue
        }
      }

    } else if (statut === 'refusee') {
      // 1. Créer une notification pour l'étudiant
      await connection.execute(
        'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
        [
          userId,
          `${responsableFullName} a refusé votre réservation #${id} de ${equipmentList}.`
        ]
      );

      // 2. Créer une notification pour le responsable
      if (respId) {
        await connection.execute(
          'INSERT INTO Notification (id_utilisateur, message, date_envoi, statut) VALUES (?, ?, NOW(), "envoye")',
          [
            respId,
            `Vous avez refusé la réservation #${id} de ${studentFullName} pour ${equipmentList}.`
          ]
        );
      }

      // 3. Envoyer des emails de rejet à l'étudiant et au responsable
      if (studentEmail) {
        // Générer l'email pour l'étudiant
        const studentEmailContent = generateReservationStatusEmail({
          recipientName: studentFullName,
          studentName: studentFullName,
          responsableName: responsableFullName,
          reservationId: id,
          equipment: equipmentItems,
          startDate: reservationItems[0].date_debut,
          endDate: reservationItems[0].date_fin,
          status: 'refusee',
          isResponsable: false
        });

        // Envoyer l'email à l'étudiant
        try {
          await sendEmail({
            to: studentEmail,
            subject: `Réservation d'Équipement #${id} Rejetée`,
            text: `Votre réservation #${id} pour ${equipmentList} a été rejetée par ${responsableFullName}.`,
            html: studentEmailContent
          });
          console.log(`Email de rejet envoyé à l'étudiant: ${studentEmail}`);
        } catch (emailError) {
          console.error('Échec de l\'envoi de l\'email de rejet à l\'étudiant:', emailError);
          // Ne pas arrêter le processus si l'envoi d'email échoue
        }
      }

      // Envoyer un email de confirmation au responsable
      if (responsableEmail) {
        // Générer l'email pour le responsable
        const responsableEmailContent = generateReservationStatusEmail({
          recipientName: responsableFullName,
          studentName: studentFullName,
          responsableName: responsableFullName,
          reservationId: id,
          equipment: equipmentItems,
          startDate: reservationItems[0].date_debut,
          endDate: reservationItems[0].date_fin,
          status: 'refusee',
          isResponsable: true
        });

        // Envoyer l'email au responsable
        try {
          await sendEmail({
            to: responsableEmail,
            subject: `Confirmation de Rejet de Réservation #${id}`,
            text: `Vous avez rejeté la réservation #${id} pour ${equipmentList} demandée par ${studentFullName}.`,
            html: responsableEmailContent
          });
          console.log(`Email de confirmation envoyé au responsable: ${responsableEmail}`);
        } catch (emailError) {
          console.error('Échec de l\'envoi de l\'email de confirmation au responsable:', emailError);
          // Ne pas arrêter le processus si l'envoi d'email échoue
        }
      }
    }

    await connection.commit();

    res.json({
      id,
      message: `Statut de réservation mis à jour à ${statut}`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la mise à jour du statut de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Supprimer une réservation
// @route   DELETE /api/reservations/:id
// @access  Private
const deleteReservation = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Obtenir les détails de la réservation avant la suppression
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
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    const reservationDetails = reservation[0];

    // Si la réservation était confirmée, mettre à jour l'équipement en conséquence
    if (reservationDetails.etat === 'validee') {
      if (reservationDetails.categorie === 'solo') {
        // Remettre le statut de l'équipement solo à disponible
        await connection.execute(
          'UPDATE Solo SET etat = "disponible" WHERE id = ?',
          [reservationDetails.id_equipement]
        );
      } else if (reservationDetails.categorie === 'stockable') {
        // Remettre la quantité en stock
        await connection.execute(
          'UPDATE Equipement SET quantite = quantite + ? WHERE id = ?',
          [reservationDetails.quantite_reservee, reservationDetails.id_equipement]
        );
      }
    }

    // Supprimer d'abord de Reservation_Equipement en raison de la contrainte de clé étrangère
    await connection.execute(
      'DELETE FROM Reservation_Equipement WHERE id_reservation = ?',
      [id]
    );

    // Supprimer la réservation
    await connection.execute(
      'DELETE FROM Reservation WHERE id = ?',
      [id]
    );

    await connection.commit();

    res.json({ message: 'Réservation supprimée avec succès' });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la suppression de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    connection.release();
  }
};

// @desc    Obtenir les réservations en attente (pour les utilisateurs responsables/admin)
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
    console.error('Erreur lors de la récupération des réservations en attente:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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