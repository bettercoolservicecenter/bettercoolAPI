const mongoose = require('mongoose');

const productBookedSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  productsBooked: [productBookedSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  bookedOn: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Pending'
  },
  serviceType: {
    type: String,
    required: false
  },
  size: {
    type: String,
    required: false
  },
  serviceTotal: {
    type: Number,
    required: false,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);