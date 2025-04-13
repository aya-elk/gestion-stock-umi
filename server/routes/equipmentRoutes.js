const express = require('express');
const router = express.Router();
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getStockableEquipment,
  getSoloEquipment
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

module.exports = router;