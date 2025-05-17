const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    required: false  // Makes it optional
  }
});

module.exports = mongoose.model('Product', productSchema);