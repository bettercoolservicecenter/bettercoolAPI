const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io", // as per your credentials
    port: 587,                     // recommended port
    auth: {
      user: "smtp@mailtrap.io", // exactly as shown in your Mailtrap dashboard
      pass: "b82ee52385bc29a7f47ea9e10c9b858d",             // your SMTP password from Mailtrap (fill actual password here)
    },
    secure: false,                  // TLS is started via STARTTLS, so false here
    requireTLS: true,               // STARTTLS is required
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
