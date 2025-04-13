const express = require('express');
const router = express.Router();
const { 
  getEquipments, 
  getEquipment, 
  addEquipment, 
  updateEquipment, 
  deleteEquipment 
} = require('../controllers/equipmentController');

// Get all equipment with optional filtering
router.get('/', getEquipments);

// Get single equipment by ID
router.get('/:id', getEquipment);

// Add new equipment
router.post('/', addEquipment);

// Update equipment
router.put('/:id', updateEquipment);

// Delete equipment
router.delete('/:id', deleteEquipment);

module.exports = router;