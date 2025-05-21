const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io", // or live.smtp.mailtrap.io for production
  port: 587,
  auth: {
    user: "api", // ✅ copy from Mailtrap
    pass: "b82ee52385bc29a7f47ea9e10c9b858d"  // ✅ copy from Mailtrap
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"BetterCool Service" <hello@demomailtrap.co>',
      to,
      subject,
      text,
    });
    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err; // so caller can handle errors if needed
  }
};

module.exports = sendEmail;
