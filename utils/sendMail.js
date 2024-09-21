import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.APP_PASSWORD,
  },
});

const sendEmailVerification = async () => {
  // Debugging output
  console.log("Sender Email:", process.env.SENDER_MAIL);
  console.log("App Password:", process.env.APP_PASSWORD);

  const mailOptions = {
    from: {
      name: "SOV",
      address: process.env.SENDER_MAIL,
    },
    to: "arvindydv03@gmail.com",
    subject: "Project Management Password",
    text: `password: test`,
  };

  try {
    // Send the email
    const mail = await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully:", mail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

sendEmailVerification();
