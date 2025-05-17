const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'ProductID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be a positive number']
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cartItems: [cartItemSchema],
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price must be a positive number']
  },
  orderedOn: {
    type: Date,
    default: Date.now
  },
  __v: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Cart', cartSchema);