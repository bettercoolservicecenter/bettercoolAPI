const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking');
const { verify, verifyAdmin } = require('../auth');

router.post("/book-now/:email", bookingController.createBooking);
router.get("/my-bookings/:email", bookingController.retrieveUserBookings);
router.get("/all-bookings", verify, verifyAdmin, bookingController.retrieveAllBookings);
router.patch("/confirm/:bookingId", bookingController.confirmBooking);
router.patch("/cancel/:bookingId", bookingController.cancelBooking);
router.patch("/complete/:bookingId", bookingController.completeBooking);

module.exports = router;