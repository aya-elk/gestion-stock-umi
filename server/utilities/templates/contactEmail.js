const generateContactEmail = (data) => {
  const { name, email, phone, message } = data;
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Template HTML avec CSS en ligne pour compatibilité email
  return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau Message de Contact</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333; background-color: #f5f7fa;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 30px 0; text-align: center; background: linear-gradient(135deg, #6c2bd9, #ff6a00);">
                    <div style="display: inline-block;">
                      <img src="http://localhost:3000/favicon.svg" alt="Logo GP" style="vertical-align: middle; height: 32px; margin-right: 10px;">
                      <h1 style="color: white; font-size: 28px; margin: 0; letter-spacing: -0.02em; font-weight: 800; display: inline-block; vertical-align: middle;">GP<span style="color: white; font-size: 32px;">.</span></h1>
                    </div>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="height: 10px;"></td>
                </tr>
              </table>
              
              <table role="presentation" style="max-width: 600px; margin: 0 auto; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);">
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-weight: 700; font-size: 24px;">Nouveau Message de Contact</h2>
                    <p style="margin-bottom: 25px; color: #666;">Un nouveau message a été reçu via le formulaire de contact le ${currentDate}.</p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Informations de Contact</h3>
                          <p style="margin-bottom: 10px;"><strong style="color: #333;">Nom:</strong> ${name}</p>
                          <p style="margin-bottom: 10px;"><strong style="color: #333;">Email:</strong> <a href="mailto:${email}" style="color: #6c2bd9; text-decoration: none;">${email}</a></p>
                          <p style="margin-bottom: 10px;"><strong style="color: #333;">Téléphone:</strong> ${phone}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-left: 4px solid #6c2bd9; background-color: #f8f9fa; border-radius: 0 8px 8px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Message</h3>
                          <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                      <tr>
                        <td style="padding: 15px 0; text-align: center;">
                          <a href="mailto:${email}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6c2bd9, #ff6a00); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 12px rgba(108, 43, 217, 0.2);">Répondre à ${name}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="padding: 30px 30px; text-align: center; color: #666; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} GP Solutions. Tous droits réservés.</p>
                    <p style="margin: 0;">Ceci est un email automatique généré par le formulaire de contact de votre site web.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
};

module.exports = { generateContactEmail };