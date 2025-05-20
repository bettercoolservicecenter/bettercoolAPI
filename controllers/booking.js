const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const Booking = require('../models/Booking');


module.exports.createBooking = async (req, res) => {
    const { email, totalPrice, name, phoneNumber, productsBooked, serviceType, size, serviceTotal } = req.body;

    try {
        // Check if a booking already exists for the provided email
        const existingBooking = await Booking.findOne({ email });
        
        // If an existing booking is found, check its status
        if (existingBooking) {
            if (existingBooking.status === 'Pending' || existingBooking.status === 'Confirmed') {
                // Check if the existing booking is for a service and productsBooked is empty
                if (existingBooking.serviceType && existingBooking.productsBooked.length === 0) {
                    // Call the updateBooking function instead of modifying directly
                    return await updateBooking(req, res, existingBooking._id, {
                        serviceType,
                        size,
                        totalPrice,
                        serviceTotal,
                        productsBooked: existingBooking.productsBooked // Retain existing products
                    });
                } else {
                    return res.status(400).json({ message: 'You already have a pending or confirmed booking.' });
                }
            }
        }

        // Create a new booking if no existing booking is found
        const newBooking = new Booking({
            email,
            totalPrice,
            name,
            phoneNumber,
            productsBooked,
            serviceType,
            size,
            serviceTotal,
        });
        await newBooking.save();

        // Respond with the new booking
        return res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
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
            productsBooked: booking.productsBooked.map(product => {
                if (product.productId) {
                    return {
                        productId: product.productId._id,
                        quantity: product.quantity,
                        subtotal: product.subtotal,
                        _id: product._id
                    };
                }
                return null;
            }).filter(product => product !== null),
            totalPrice: booking.totalPrice,
            status: booking.status,
            orderedOn: booking.bookedOn,
            serviceType: booking.serviceType,
            size: booking.size,
            serviceTotal: booking.serviceTotal,
            __v: booking.__v
        }));

        // Check for pending or confirmed bookings
        const hasPendingOrConfirmed = formattedBookings.some(booking => 
            booking.status === 'Pending' || booking.status === 'Confirmed'
        );

        // Check for completed or canceled bookings
        const hasCompletedOrCanceled = formattedBookings.some(booking => 
            booking.status === 'Completed' || booking.status === 'Canceled'
        );

        // Send the formatted orders as a response along with the booking status
        return res.status(200).json({ 
            bookings: formattedBookings,
            hasPendingOrConfirmed,
            hasCompletedOrCanceled
        });
    } catch (err) {
        console.error('Error retrieving user bookings:', err);
        return res.status(500).json({ message: 'Failed to retrieve user bookings', error: err.message });
    }
};

module.exports.retrieveAllBookings = async (req, res) => {
    try {
        // Fetch all bookings and populate product details
        const bookings = await Booking.find({})
            .populate('productsBooked.productId')
            .exec();

        // Group bookings by email
        const bookingsByEmail = bookings.reduce((acc, booking) => {
            const email = booking.email; // Use the email field from the booking
            if (!acc[email]) {
                acc[email] = [];
            }
            acc[email].push({
                _id: booking._id,
                productsBooked: booking.productsBooked.map(product => ({
                    productId: product.productId ? product.productId._id : null,
                    quantity: product.quantity,
                    subtotal: product.subtotal,
                    _id: product._id
                })),
                totalPrice: booking.totalPrice,
                status: booking.status,
                orderedOn: booking.bookedOn,
                __v: booking.__v
            });
            return acc;
        }, {});

        return res.status(200).json({ bookings: bookingsByEmail });
    } catch (error) {
        console.error('Error retrieving all bookings:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports.confirmBooking = async (req, res) => {
    const { bookingId } = req.params; // Get booking ID from URL parameters

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the booking status
        booking.status = 'Confirmed'; // Update the status as needed
        await booking.save();

        return res.status(200).json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        console.error('Error confirming booking:', error);
        return res.status(500).json({ message: 'Error confirming booking', error: error.message });
    }
};

module.exports.cancelBooking = async (req, res) => {
    const { bookingId } = req.params; // Get booking ID from URL parameters

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the booking status to 'Canceled'
        booking.status = 'Canceled'; // Update the status as needed
        await booking.save();

        return res.status(200).json({ message: 'Booking canceled successfully', booking });
    } catch (error) {
        console.error('Error canceling booking:', error);
        return res.status(500).json({ message: 'Error canceling booking', error: error.message });
    }
};

module.exports.completeBooking = async (req, res) => {
    const { bookingId } = req.params; // Get booking ID from URL parameters

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the booking status to 'Completed'
        booking.status = 'Completed'; // Update the status as needed
        await booking.save();

        return res.status(200).json({ message: 'Booking completed successfully', booking });
    } catch (error) {
        console.error('Error completing booking:', error);
        return res.status(500).json({ message: 'Error completing booking', error: error.message });
    }
};

module.exports.updateBooking = async (req, res) => {
    const { bookingId } = req.params;
    const { serviceType, size, totalPrice, productsBooked, serviceTotal } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the booking fields
        booking.totalPrice += totalPrice; // Add the new total price

        // Update service total only if provided, otherwise retain existing value
        if (serviceTotal) {
            booking.serviceTotal += serviceTotal; // Add to existing service total
        }

        booking.productsBooked = productsBooked; // Update products booked

        // Retain existing service type and size if they are not provided in the request
        if (!serviceType) {
            booking.serviceType = booking.serviceType; // Retain existing service type
        } else {
            booking.serviceType = serviceType; // Update service type if provided
        }

        if (!size) {
            booking.size = booking.size; // Retain existing size
        } else {
            booking.size = size; // Update size if provided
        }

        await booking.save();
        return res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};
