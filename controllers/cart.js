const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');


const { errorHandler } = require('../auth');

module.exports.getCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // Allow for anonymous access

    // Find the cart for the user or anonymous user
    const cart = await Cart.findOne({ userId: userId || null }).populate('cartItems.productId');

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Check if cartItems exist and map them
    const cartItems = cart.cartItems.map(item => {
      if (item && item.productId) { // Ensure item and productId are not null
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          subtotal: item.subtotal,
          _id: item._id
        };
      }
      return null; // Return null for any invalid items
    }).filter(item => item !== null); // Filter out null items

    // Send the cart as a response
    return res.status(200).json({
      cart: {
        _id: cart._id,
        userId: cart.userId,
        cartItems: cartItems, // Use the filtered cart items
        totalPrice: cart.totalPrice,
        orderedOn: cart.orderedOn,
        __v: cart.__v
      }
    });
  } catch (error) {
    console.error('Error retrieving cart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.addToCart = async (req, res) => {
// Log the incoming request body
  try {
    const { productId, quantity } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if the product is active
    if (!product.isActive) {
      console.log('Product is not active:', productId);
      return res.status(400).json({ success: false, message: 'Product is not active' });
    }

    // Calculate subtotal for the product
    const subtotal = product.price * quantity;

    // Find or create a cart (allowing anonymous carts)
    let cart = await Cart.findOne({ userId: null });

    if (!cart) {
      cart = new Cart({
        userId: null,
        cartItems: [],
        totalPrice: 0,
        orderedOn: new Date()
      });
      console.log('Created new cart for anonymous user');
    }

    // Check if the product is already in the cart
    const existingItemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

    if (existingItemIndex > -1) {
      cart.cartItems[existingItemIndex].quantity += quantity;
      cart.cartItems[existingItemIndex].subtotal += subtotal;
      console.log('Updated existing item in cart:', cart.cartItems[existingItemIndex]);
    } else {
      cart.cartItems.push({ productId, quantity, subtotal });
      console.log('Added new item to cart:', { productId, quantity, subtotal });
    }

    cart.totalPrice += subtotal;

    await cart.save();

    return res.status(200).json({
      message: 'Item added to cart successfully',
      cart: {
        _id: cart._id,
        userId: cart.userId,
        cartItems: cart.cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          subtotal: item.subtotal,
          _id: item._id
        })),
        totalPrice: cart.totalPrice,
        orderedOn: cart.orderedOn,
        __v: cart.__v
      }
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports.updateCartQuantity = async (req, res) => {
  try {
    const { productId, newQuantity } = req.body; // No userId from req.user

    // Validate that newQuantity is a number and greater than 0
    if (typeof newQuantity !== 'number' || newQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if the product is active
    if (!product.isActive) {
      return res.status(400).json({ success: false, message: 'Product is not active' });
    }

    // Find the cart (you may want to use a session or cookie to track carts)
    const cart = await Cart.findOne({ userId: null }); // Change to allow anonymous carts

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Find the item in the cart
    const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Update the quantity and subtotal of the item
    const oldSubtotal = cart.cartItems[itemIndex].subtotal;
    cart.cartItems[itemIndex].quantity = newQuantity; // Use 'newQuantity'
    cart.cartItems[itemIndex].subtotal = product.price * newQuantity; // Calculate subtotal correctly

    // Update the total price of the cart
    cart.totalPrice = cart.totalPrice - oldSubtotal + cart.cartItems[itemIndex].subtotal;

    // Save the updated cart
    await cart.save();

    // Send the updated cart as a response
    return res.status(200).json({
      message: 'Item quantity updated successfully',
      updatedCart: {
        _id: cart._id,
        userId: cart.userId,
        cartItems: cart.cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          subtotal: item.subtotal,
          _id: item._id
        })),
        totalPrice: cart.totalPrice,
        orderedOn: cart.orderedOn,
        __v: cart.__v
      }
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params; // Retrieve productId from URL parameters

        // Allow for anonymous access by searching for the cart with userId as null
        const cart = await Cart.findOne({ userId: null });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Remove the item from the cart
        const removedItem = cart.cartItems.splice(itemIndex, 1)[0];

        // Update the total price of the cart
        cart.totalPrice -= removedItem.subtotal;

        // Save the updated cart
        await cart.save();

        // Send the updated cart as a response
        return res.status(200).json({
            message: 'Item removed from cart successfully',
            updatedCart: {
                _id: cart._id,
                userId: cart.userId,
                cartItems: cart.cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    _id: item._id
                })),
                totalPrice: cart.totalPrice,
                orderedOn: cart.orderedOn,
                __v: cart.__v
            }
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports.clearCart = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null; // Allow for anonymous access

        // Find the user's cart (or anonymous cart)
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Clear all items from the cart
        cart.cartItems = [];
        cart.totalPrice = 0;

        // Save the updated cart
        await cart.save();

        // Send the updated cart as a response
        return res.status(200).json({
            message: 'Cart cleared successfully',
            cart: {
                _id: cart._id,
                userId: cart.userId,
                cartItems: cart.cartItems,
                totalPrice: cart.totalPrice,
                orderedOn: cart.orderedOn,
                __v: cart.__v
            }
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports.bookItem = async (req, res) => {
  // Your logic for booking an item
};

module.exports.getCartItemCount = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // Allow for anonymous access

    // Find the cart for the user or anonymous user
    const cart = await Cart.findOne({ userId: userId || null });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Calculate total quantity
    const totalQuantity = cart.cartItems.reduce((total, item) => total + item.quantity, 0);

    // Send the total quantity as a response
    return res.status(200).json({
      success: true,
      totalQuantity
    });
  } catch (error) {
    console.error('Error retrieving cart item count:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const handleBookNow = async (guestInfo) => {
    const bookingData = {
        email: guestInfo.email,
        name: guestInfo.name,
        phoneNumber: guestInfo.phoneNumber,
        totalPrice: cart.totalPrice,
        productsBooked: cart.cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            subtotal: item.subtotal,
        })),
        serviceType: selectedService,
        size: selectedSize,
        serviceTotal: totalPrice
    };

    try {
        // Check for existing bookings
        const existingResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/bookings/my-bookings/${bookingData.email}`);
        const existingData = await existingResponse.json();

        if (existingResponse.ok) {
            // Allow booking if the existing booking is for a product or if productsBooked is empty
            const hasPendingService = existingData.bookings.some(booking => 
                booking.serviceType && (booking.status === 'Pending' || booking.status === 'Confirmed')
            );

            // If there are no pending services, proceed with booking
            if (!hasPendingService) {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/bookings/book-now/${bookingData.email}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingData),
                });

                if (response.ok) {
                    notyf.success('Product booked successfully!');
                    await handleClearCart();
                    navigate(`/bookings/${bookingData.email}`);
                } else {
                    const errorData = await response.json();
                    notyf.error(errorData.message || 'Failed to book product');
                }
            } else {
                notyf.error('You cannot book a product while you have a pending service.');
            }
        } else {
            notyf.error('Failed to fetch existing bookings');
        }
    } catch (error) {
        console.error('Error during booking:', error);
        notyf.error('An error occurred while processing your booking');
    }

    setShowModal(false);
};