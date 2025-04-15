const nodemailer = require('nodemailer');
require('dotenv-flow').config();

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or another service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send emails
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.log(process.env.EMAIL_PASSWORD);
    console.error('Email error: ', error);
    throw error;
  }
};

module.exports = { sendEmail };