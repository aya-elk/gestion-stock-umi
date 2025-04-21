const express = require('express');
const { authUser, getUsers, createUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

// Route pour l'authentification
router.post('/login', authUser);

// Routes pour la gestion des utilisateurs
router.get('/', getUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

module.exports = router;