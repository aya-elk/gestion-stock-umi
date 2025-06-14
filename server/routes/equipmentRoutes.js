const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getStockableEquipment,
  getSoloEquipment,
  updateEquipmentState // Add the new handler
} = require('../controllers/equipmentController');

// Routes for specific equipment types
router.get('/stockable', getStockableEquipment);
router.get('/solo', getSoloEquipment);

// Main equipment routes
router.route('/')
  .get(getAllEquipment)
  .post(createEquipment);

router.route('/:id')
  .get(getEquipmentById)
  .put(updateEquipment)
  .delete(deleteEquipment);

// Make sure this route exists
router.patch('/:id/state', updateEquipmentState);

module.exports = router;