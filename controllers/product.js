const Product = require('../models/Product');
const bcrypt = require('bcryptjs');
const auth = require('../auth');
const { errorHandler } = require('../auth');

module.exports.createProduct = (req, res) => {
  // Create a new Product instance
  let newProduct = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      imageUrl: req.body.imageUrl // Add this line to include imageUrl
  });

  // Check if product with same name already exists
  return Product.findOne({ name: req.body.name })
      .then(existingProduct => {
          // If product already exists
          if (existingProduct) {
              return res.status(409).send({ 
                  success: false,
                  message: 'Product already exists'
              });
          } 
          // If product doesn't exist, save the new product
          else {
              return newProduct.save()
                  .then(result => res.status(201).send({
                      success: true,
                      message: 'Product added successfully',
                      result
                  }))
                  .catch(err => errorHandler(err, req, res));
          }
      })
      .catch(err => errorHandler(err, req, res));
};

// GET /products/all - Admin only
module.exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /products/active - Public
module.exports.getActiveProducts = async (req, res) => {
  try {
    const activeProducts = await Product.find({ isActive: true });
    res.status(200).json(activeProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /products/:productId - Public
module.exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports.updateProduct = (req, res) => {
  const { productId } = req.params;
  const { name, description, price, imageUrl } = req.body;

  // Validate that the required fields are present
  if (!productId) {
    const error = new Error('Product ID is required');
    error.statusCode = 400;
    return errorHandler(error, req, res);
  }

  if (!name || !description || typeof price !== 'number') {
    const error = new Error('Name, description, and price are required');
    error.statusCode = 400;
    return errorHandler(error, req, res);
  }

  // Create updates object with required fields
  const updates = { name, description, price };

  // Add imageUrl to updates only if it's provided
  if (imageUrl) {
    try {
      // Basic URL validation
      new URL(imageUrl);
      updates.imageUrl = imageUrl;
    } catch (error) {
      const validationError = new Error('Invalid image URL format');
      validationError.statusCode = 400;
      return errorHandler(validationError, req, res);
    }
  } else {
    // If no imageUrl is provided, set a placeholder image
    updates.imageUrl = "https://dn721803.ca.archive.org/0/items/placeholder-image//placeholder-image.jpg";
  }

  Product.findByIdAndUpdate(productId, updates, { new: true })
    .then(updatedProduct => {
      if (!updatedProduct) {
        return res.status(404).json({
          error: "Product not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct
      });
    })
    .catch(error => {
      console.error('Error updating product:', error);
      return errorHandler(error, req, res);
    });
};

module.exports.archiveProduct = (req, res) => {
  const { productId } = req.params;

  Product.findById(productId)
    .then(product => {
      if (!product) {
        // Product not found
        return res.status(404).json({ error: "Product not found" });
      }

      if (!product.isActive) {
        // Product already archived
        return res.status(200).json({
          message: "Product already archived",
          archivedProduct: product
        });
      }

      // Archive the product
      product.isActive = false;
      return product.save().then(updatedProduct => {
        return res.status(200).json({
          success: true,
          message: "Product archived successfully",
        });
      });
    })
    .catch(error => errorHandler(error, req, res));
};

module.exports.activateProduct = (req, res) => {
  const { productId } = req.params;

  Product.findById(productId)
    .then(product => {
      if (!product) {
        // Course not found
        return res.status(404).send({error: 'Product not found'});
      }

      if (product.isActive) {
        // Course already active
        return res.status(200).send({ 
        	message: "Product already active",
        	activateProduct: product
        	 });
      }

      // Activate course
      product.isActive = true;
      return product.save().then(() => {
        return res.status(200).json({
        	success: true,
        	message: "Product activated successfully"

        });
      });
    })
    .catch(error => {
      return errorHandler(error, req, res);
    });
};

module.exports.searchByName = async (req, res) => {
  try {
      const { name } = req.body; // Retrieve the name from request body

      // Validate that the name is provided
      if (!name) {
          return res.status(400).json({ success: false, message: 'Product name is required' });
      }

      // Search for products by name using a case-insensitive regex
      const products = await Product.find({ name: new RegExp(name, 'i') });

      // Send the found products as a response
      return res.status(200).json(products.map(product => ({
          _id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
          createdOn: product.createdOn,
          __v: product.__v
      })));
  } catch (error) {
      console.error('Error searching for products by name:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports.searchByPrice = async (req, res) => {
  try {
      const { minPrice, maxPrice } = req.body; // Retrieve minPrice and maxPrice from request body

      // Validate that minPrice and maxPrice are provided and are numbers
      if (minPrice === undefined || maxPrice === undefined || isNaN(minPrice) || isNaN(maxPrice)) {
          return res.status(400).json({ success: false, message: 'Valid minPrice and maxPrice are required' });
      }

      // Convert minPrice and maxPrice to numbers
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);

      // Search for products within the price range
      const products = await Product.find({ price: { $gte: min, $lte: max } });

      // Send the found products as a response
      return res.status(200).json(products.map(product => ({
          _id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          isActive: product.isActive,
          imageUrl: product.imageUrl,
          createdOn: product.createdOn,
          __v: product.__v
      })));
  } catch (error) {
      console.error('Error searching for products by price range:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};