const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const { verify, isLoggedIn, verifyAdmin } = require('../auth');

// Admin-only routes
router.post('/', verify, verifyAdmin, productController.createProduct);
router.get('/all', verify, verifyAdmin, productController.getAllProducts);

// Public routes
router.get('/active', productController.getActiveProducts);
router.get('/:productId', productController.getProductById);
router.patch('/:productId/update', verify, verifyAdmin, productController.updateProduct);
router.patch('/:productId/archive', verify, verifyAdmin, productController.archiveProduct);
router.patch('/:productId/activate', verify, verifyAdmin, productController.activateProduct);
router.post('/search-by-name', productController.searchByName);
router.post('/search-by-price', productController.searchByPrice);
router.post('/search-by-description', productController.searchByDescription);
router.post('/filter', productController.filterProducts);

module.exports = router;