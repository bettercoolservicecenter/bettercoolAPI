const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../auth');
const { errorHandler } = require('../auth');

module.exports.registerUser = (req, res) => {
    const reqBody = req.body;
    const { firstName, lastName, email, mobileNo, password } = reqBody;

    // Basic field presence check
    if (!firstName || !lastName || !email || !mobileNo || !password) {
        return res.status(400).json(false);
    }

    // Mobile number validation (exactly 11 digits)
    if (mobileNo.length !== 11) {
        return res.status(400).send({ error: "Mobile number invalid"});
    }

    // Email format validation
    if (!email.includes('@')) {
        return res.status(400).send({ error: "Email invalid"});
    }

    // Password length validation
    if (password.length < 8) {
        return res.status(400).send({ error: "Password must be atleast 8 characters"});
    }

    // Proceed to check if user already exists
    User.findOne({ email: email })
        .then(existingUser => {
            if (existingUser) {
                return res.status(409).json({ error: "Email already in use" });
            }

            let newUser = new User({
                firstName,
                lastName,
                email,
                mobileNo,
                password: bcrypt.hashSync(password, 12)
            });

            return newUser.save()
                .then(() => {
                    return res.status(201).json({ message: "Registered Successfully" });
                })
                .catch(err => {
                    return errorHandler(err, req, res);
                });
        })
        .catch(err => {
            return errorHandler(err, req, res);
        });
};

module.exports.loginUser = (req, res) => {

    // if the email contains "@"
    if(req.body.email.includes("@")) {

        // use the .findOne() method to find the first document in the users collection that matches the email given in the request body
        // it will return the document and store it in the variable "result"
        // User.findOne({ email : "halmonte@mail.com" })
        /*
            result = {
                firstName: "Hillary",
                lastName: "Almonte",
                email: "halmonte@mail.com",
                password: "$2b$12$v1HKMytZxXe0ifk2IagWbudr.3FOH0Zj4IlmSMlRYMWmSfkHS4qwm",
                isAdmin: false,
                mobileNo: "09123456789",
                _id: "67ecab6355c861bb1cd66c74",
                __v: 0
            }
        */
        return User.findOne({ email: req.body.email }).then(result => {

            // if there is no document found
            if(result == null) {

                return res.status(404).send({ message: 'No email found' });

            // else, a document with the same email is found
            } else {

                // .compareSync() method will cpmpare the given arguments to check if it matches. It compares the non-encrypted password to the encrypted password
                // it will return true if the paassword matches
                // bcrypt.compareSync("user1234", "$2b$12$v1HKMytZxXe0ifk2IagWbudr.3FOH0Zj4IlmSMlRYMWmSfkHS4qwm")
                const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

                // if the password is correct
                if(isPasswordCorrect) {

                    // generate an access token using the createAccessToken function we created in the auth.js
                    // It will also send the user details as the argument
                    /*
                        access: auth.createAccessToken({
                            firstName: "Hillary",
                            lastName: "Almonte",
                            email: "halmonte@mail.com",
                            password: "$2b$12$v1HKMytZxXe0ifk2IagWbudr.3FOH0Zj4IlmSMlRYMWmSfkHS4qwm",
                            isAdmin: false,
                            mobileNo: "09123456789",
                            _id: "67ecab6355c861bb1cd66c74",
                            __v: 0
                        })
                    */
                    /*
                        access: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWNhYjYzNTVjODYxYmIxY2Q2NmM3NCIsImVtYWlsIjoiaGFsbW9udGVAbWFpbC5jb20iLCJpc0FkbWluIjpmYWxzZSwiaWF0IjoxNzQzNTcxNjcxfQ.O3zXpX66x3wYCXB9oV4UVRK_0zKvXDsIv-3-cVtFqdw"
                    */
                    return res.status(200).send({ 
                        message: 'User logged in successfully',
                        access : auth.createAccessToken(result)
                    })

                // if the password is incorrect
                } else {
                    return res.status(401).send({ message: 'Incorrect email or password' });
                }
            }
        })
        .catch(error => errorHandler(error, req, res));
    } else {
        return res.status(400).send({ message: 'Invalid email format' });
    }
}

module.exports.getProfile = (req, res) => {

    // We called the User constant variable which contains the "require" directive to load the user model. This will allows access to the "users" collectiion in our database.
    // We chained findById() to find the document in the "users" collection that conatins the same "_id" value as the one given in the req.user.id
    // return User.findOne({ _id: req.user.id})
    return User.findById(req.user.id)
    // If it finds a document with the correct id, it will then return the document found and saved it in the variable "user"
    // If it did not find a document with the same id value, it will return null and save it in the variable "user"
    .then(user => {
        // if there is no user document found
        if(!user) {
            return res.status(200).send({ message: 'invalid signature' })
        } else {
            // temporarily set the password to an empty string so the password will not be displayed when sent back to the client
            user.password = "";
            // .status(status_code) is chained to send the HTTP status code together with the response back to the client
            // 200 status code means OK. This means that the request is successful and the resource has been fetched and transmitted back to the client
            // .send() is chanied to send the response back to the client
            // In this case, the document with the empty string password is send back to postman/client
            return res.status(200).send(user);
        }
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.updateUserAsAdmin = async (req, res) => {
  try {
    const adminUser = req.user;

    if (!adminUser.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const userId = req.params.id; // Access userId from req.params

    // Update the user to set isAdmin to true
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true }, // Only updating the isAdmin field
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the updated user details
    res.json({ message: 'User updated as admin successfully', updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user as admin' });
  }
};
module.exports.updatePassword = async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        user.password = bcrypt.hashSync(newPassword, 12);
        await user.save();

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong updating the password.' });
    }
};


