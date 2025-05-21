const Cart = require('../models/Cart');
const User = require('../models/User');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

const updateBooking = async (req, res, bookingId, updateData) => {
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the booking fields
        booking.serviceType = updateData.serviceType || booking.serviceType;
        booking.size = updateData.size || booking.size;
        booking.totalPrice += updateData.totalPrice; // Add the new total price
        booking.serviceTotal += updateData.serviceTotal; // Add to existing service total
        booking.productsBooked = updateData.productsBooked; // Update products booked

        await booking.save();
        return res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};

module.exports.createBooking = async (req, res) => {
    const { email, totalPrice, name, phoneNumber, productsBooked, serviceType, size, serviceTotal } = req.body;

    try {
        // Check if a booking already exists for the provided email
        const existingBooking = await Booking.findOne({ email });
        
        // If an existing booking is found, check its status
        if (existingBooking) {
            // Check if the existing booking has products booked
            const hasProductsBooked = existingBooking.productsBooked.length > 0;

            // If there are products booked, update the existing booking
            if (hasProductsBooked) {
                // Update the existing booking with the new service details
                existingBooking.serviceType = serviceType;
                existingBooking.size = size;
                existingBooking.totalPrice += totalPrice; // Add the new service total to the existing total
                existingBooking.serviceTotal += serviceTotal; // Add to existing service total

                // Add the new service to the productsBooked array
                existingBooking.productsBooked.push(...productsBooked); // Assuming productsBooked is an array

                await existingBooking.save(); // Save the updated booking

                return res.status(200).json({ message: 'Booking updated successfully', booking: existingBooking });
            }
        }

        // If no existing booking or no products booked, create a new booking
        const newBooking = new Booking({
            email,
            totalPrice,
            name,
            phoneNumber,
            productsBooked, // Ensure this is included
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
        const bookings = await Booking.find({})
            .populate('productsBooked.productId')
            .exec();

        const bookingsByEmail = bookings.reduce((acc, booking) => {
            const email = booking.email;
            if (!acc[email]) {
                acc[email] = [];
            }
            acc[email].push({
                _id: booking._id,
                productsBooked: booking.productsBooked.map(product => ({
                    productId: product.productId ? product.productId._id : null,
                    name: product.productId ? product.productId.name : null,
                    quantity: product.quantity,
                    subtotal: product.subtotal,
                    _id: product._id
                })),
                totalPrice: booking.totalPrice,
                status: booking.status,
                orderedOn: booking.bookedOn,
                serviceType: booking.serviceType,
                size: booking.size,
                serviceTotal: booking.serviceTotal,
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
    const { bookingId } = req.params; // Get booking ID from URL parameters
    const updateData = req.body; // Get update data from request body

    console.log('Booking ID:', bookingId);
    console.log('Update Data:', updateData);

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update booking fields
        booking.serviceType = updateData.serviceType || booking.serviceType;
        booking.size = updateData.size || booking.size;
        booking.totalPrice += updateData.totalPrice; // Update total price
        booking.serviceTotal += updateData.serviceTotal; // Update service total
        booking.productsBooked = updateData.productsBooked; // Update products booked

        await booking.save();
        return res.status(200).json({ message: 'Booking updated successfully', booking });
    } catch (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ message: 'Error updating booking', error: error.message });
    }
};

module.exports.bookProductOrService = async (req, res) => {
    const { email, name, phoneNumber, productsBooked, serviceType, size, serviceTotal } = req.body;

    console.log('Received booking data:', req.body);

    try {
        // Fetch existing bookings for the user
        const existingBooking = await Booking.findOne({ email });

        let totalPrice = 0;
        let updatedProductsBooked = [];

        // If there is an existing booking
        if (existingBooking) {
            // If the existing booking has products booked
            if (existingBooking.productsBooked.length > 0) {
                // Retain existing products and add new products
                updatedProductsBooked = [...existingBooking.productsBooked, ...productsBooked];
                totalPrice = existingBooking.totalPrice; // Start with existing total price
            } else {
                // If no products booked, just add the new products
                updatedProductsBooked = productsBooked;
            }

            // If the user is booking a service
            if (serviceType) {
                totalPrice += serviceTotal; // Add service total to the existing total
                existingBooking.serviceType = serviceType; // Update service type
                existingBooking.size = size; // Update size
                existingBooking.serviceTotal = serviceTotal; // Update service total
            }

            // Update total price
            existingBooking.totalPrice = totalPrice;
            existingBooking.productsBooked = updatedProductsBooked;

            await existingBooking.save(); // Save the updated booking
            return res.status(200).json({ message: 'Booking updated successfully', booking: existingBooking });
        } else {
            // If no existing booking, create a new one
            totalPrice = productsBooked.reduce((acc, product) => acc + product.subtotal, 0) + serviceTotal;

            const newBooking = new Booking({
                email,
                name,
                phoneNumber,
                productsBooked,
                totalPrice,
                serviceType,
                size,
                serviceTotal,
            });

            await newBooking.save(); // Save the new booking
            return res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
        }
    } catch (error) {
        console.error('Error during booking:', error);
        return res.status(500).json({ message: 'Error during booking', error: error.message });
    }
};

