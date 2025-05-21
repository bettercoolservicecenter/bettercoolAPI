const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "your_mailtrap_username",
    pass: "your_mailtrap_password"
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: '"Booking System" <hello@demomailtrap.co>',
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
