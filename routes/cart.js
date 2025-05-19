const express = require('express');
const cartController = require('../controllers/cart');

const router = express.Router();


 router.get('/get-cart', cartController.getCart);
 router.post('/add-to-cart', cartController.addToCart);
 router.patch('/update-cart-quantity', cartController.updateCartQuantity);
 router.post('/book', cartController.bookItem);
 router.patch('/:productId/remove-from-cart', cartController.removeFromCart);
 router.put('/clear-cart', cartController.clearCart);
 router.get('/cart-item-count', cartController.getCartItemCount);

// member 5 ends here

module.exports = router;