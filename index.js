const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const userRoute = require('./routes/user');
const productRoute = require('./routes/product');
const cartRoute = require('./routes/cart');
const bookingRoute = require('./routes/booking');

const app = express();
const port = process.env.PORT;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_STRING)
  .then(() => console.log('Now connected to MongoDB Atlas'))
  .catch(err => console.error('Failed to connect to MongoDB Atlas', err));

// Middleware
app.use(express.json());
const corsOptions = {
    // Origin of the request
    origin: ['http://localhost:8000', 'http://localhost:3000'],
    // methods: ['GET', 'POST'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));


// Import and use the user router

app.use('/users', userRoute);
app.use('/products', productRoute);
app.use('/cart', cartRoute);
app.use('/bookings', bookingRoute);


// Start the server
if (require.main === module) {
  app.listen(port, () => console.log(`API is now online on port ${port}`));
}

module.exports = { app, mongoose };