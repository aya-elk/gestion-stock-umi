const express = require('express');
const router = express.Router();
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservationStatus,
  deleteReservation,
  getPendingReservations
} = require('../controllers/reservationController');

// Get all reservations or filter by user/status
router.get('/', getAllReservations);

// Get pending reservations (for admin/responsible users)
router.get('/pending', getPendingReservations);

// Get, update, or delete a specific reservation
router.route('/:id')
  .get(getReservationById)
  .patch(updateReservationStatus)
  .delete(deleteReservation);

// Create a new reservation
router.post('/', createReservation);

module.exports = router;