const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const Booking = require('../models/Booking');


module.exports.createBooking = async (req, res) => {
    const { email, totalPrice, name, phoneNumber, productsBooked } = req.body;

    try {
        // Check if a booking already exists for the provided email
        const existingBooking = await Booking.findOne({ email });
        if (existingBooking) {
            return res.status(400).json({ message: 'You already have a booking.' });
        }

        // Create a new booking with required fields
        const newBooking = new Booking({
            email,
            totalPrice,
            name,
            phoneNumber,
            productsBooked,
            // bookedOn will automatically be set to the current date due to the schema definition
        });
        await newBooking.save();

        // Respond with the new booking
        return res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating booking:', error); // Log the error for debugging
        return res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
};

// 2. Get Logged-in User's Orders - POST /api/orders/my-orders
module.exports.retrieveUserBookings = async (req, res) => {
    try {
        const email = req.params.email; // Get email from URL parameters

        // Find orders for the user based on email
        const bookings = await Booking.find({ email }).populate('productsBooked.productId');

        // Format the response to match the specified structure
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            userId: booking.userId,
            productsBooked: booking.productsBooked.map(product => ({
                productId: product.productId._id,
                quantity: product.quantity,
                subtotal: product.subtotal,
                _id: product._id
            })),
            totalPrice: booking.totalPrice,
            status: booking.status,
            orderedOn: booking.bookedOn, // Ensure this matches the field in your model
            __v: booking.__v
        }));

        // Send the formatted orders as a response
        return res.status(200).json({ bookings: formattedBookings });
    } catch (err) {
        console.error('Error retrieving user bookings:', err);
        return res.status(500).json({ message: 'Failed to retrieve user bookings', error: err.message });
    }
};

module.exports.retrieveAllBookings = async (req, res) => {
    try {
      // Populate both product details and user details
      const bookings = await Booking.find({})
        .populate('productsBooked.productId')
        .populate('userId', 'email') // Add this line to populate user email
        .exec();
  
      const formattedBookings = bookings.map(booking => ({
        _id: booking._id,
        userId: booking.userId._id, // Keep the ID
        userEmail: booking.userId.email, // Add the email
        productsBooked: booking.productsBooked.map(product => ({
          productId: product.productId ? product.productId._id : null,
          quantity: product.quantity,
          subtotal: product.subtotal,
          _id: product._id
        })),
        totalPrice: booking.totalPrice,
        status: booking.status,
        orderedOn: booking.orderedOn,
        __v: booking.__v
      }));
  
      return res.status(200).json({ bookings: formattedBookings });
    } catch (error) {
      console.error('Error retrieving all bookings:', error);
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };
