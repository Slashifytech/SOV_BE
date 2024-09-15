const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config({
  path: "./env", // Ensure the correct path to your .env file
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendEmailVerification = async (email, password) => {
  
  const mailOptions = {
    from: {
      name: "Project Managment",
      address: process.env.SENDER_MAIL,
    }, // sender address
    to: email, // recipient email address (can be Gmail or Mailinator)
    subject: "Project Management Password", // Subject line
    text: `password: ${password}`,
  };

  try {
    // Send the email
    const mail = await transporter.sendMail(mailOptions, () => {
      console.log("Mail sent successfully");
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { sendEmailVerification };
