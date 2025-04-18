require('dotenv-flow').config();
const { sendEmail } = require('../utilities/mailer');
const { generateContactEmail } = require('../utilities/templates/contactEmail');

// @desc    Envoyer l'email du formulaire de contact
// @route   POST /api/contact
// @access  Public
const sendContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Générer le contenu HTML en utilisant le template
    const htmlContent = generateContactEmail({ name, email, phone, message });

    await sendEmail({
      to: process.env.EMAIL_CONTACT,
      subject: `Nouveau message de contact de : ${name}`,
      text: `
        Nom: ${name}
        Email: ${email}
        Téléphone: ${phone}
        Message: ${message}
      `,
      html: htmlContent
    });

    res.status(200).json({ success: true, message: 'Email envoyé avec succès' });
  } catch (error) {
    console.error('Erreur du formulaire de contact:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { sendContactForm };