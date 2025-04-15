const { sendEmail } = require('../utilities/mailer');

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
const sendContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    await sendEmail({
      to: 'essarhir.t@outlook.com', // Your admin email
      subject: 'New Contact Form Submission',
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `
    });
    
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendContactForm };