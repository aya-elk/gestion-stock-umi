require('dotenv-flow').config();
const { sendEmail } = require('../utilities/mailer');
const { generateContactEmail } = require('../utilities/templates/contactEmail');

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
const sendContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Generate HTML content using the template
    const htmlContent = generateContactEmail({ name, email, phone, message });

    await sendEmail({
      to: process.env.EMAIL_CONTACT,
      subject: `New Contact Message from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `,
      html: htmlContent
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendContactForm };