const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "live.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "smtp@mailtrap.io", // Use your Mailtrap username
    pass: "b82ee52385bc29a7f47ea9e10c9b858d" // Use your Mailtrap password
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: '"Booking System" <no-reply@yourdomain.com>',
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
