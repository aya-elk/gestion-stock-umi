const generateReservationEmail = (data) => {
  const { studentName, reservationId, equipment, startDate, endDate } = data;
  const formattedStartDate = new Date(startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedEndDate = new Date(endDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Création du HTML pour la liste d'équipement
  const equipmentListHTML = equipment.map(item =>
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
    </tr>`
  ).join('');

  // Modèle HTML avec CSS en ligne pour compatibilité email
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de Réservation d'Équipement</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333; background-color: #f5f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 30px 0; text-align: center; background: linear-gradient(135deg, #6c2bd9, #ff6a00);">
                  <div style="display: inline-block;">
                    <img src="http://localhost:3000/favicon.svg" alt="Logo GIMS" style="vertical-align: middle; height: 32px; margin-right: 10px;">
                    <h1 style="color: white; font-size: 28px; margin: 0; letter-spacing: -0.02em; font-weight: 800; display: inline-block; vertical-align: middle;">GIMS<span style="color: white; font-size: 32px;">.</span></h1>
                  </div>
                </td>
              </tr>
            </table>
            
            <table role="presentation" style="max-width: 600px; margin: 20px auto; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);">
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-weight: 700; font-size: 24px;">Confirmation de Réservation d'Équipement</h2>
                  <p style="margin-bottom: 25px; color: #666;">
                    Bonjour ${studentName},<br>
                    Merci pour votre réservation d'équipement. Votre demande a été reçue et est actuellement <strong>en attente d'approbation</strong>.
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Détails de la Réservation</h3>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">ID de Réservation:</strong> #${reservationId}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Statut:</strong> <span style="color: #f39c12; font-weight: 600;">En Attente d'Approbation</span></p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Date de Début:</strong> ${formattedStartDate}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Date de Fin:</strong> ${formattedEndDate}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; border-left: 4px solid #6c2bd9; background-color: #f8f9fa; border-radius: 0 8px 8px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Résumé de l'Équipement</h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                          <thead>
                            <tr>
                              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Équipement</th>
                              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantité</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${equipmentListHTML}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
                        <h3 style="color: #2980b9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Prochaines Étapes</h3>
                        <p style="margin: 0 0 10px 0;">Votre demande de réservation sera examinée par un membre du personnel responsable. Vous recevrez une autre notification lorsque votre demande sera approuvée ou rejetée.</p>
                        <p style="margin: 0;">Si elle est approuvée, vous pourrez récupérer votre équipement auprès du bureau du technicien pendant les heures d'ouverture. Veuillez apporter votre carte d'étudiant et mentionner votre numéro de réservation.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
              <tr>
                <td style="padding: 30px 30px; text-align: center; color: #666; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} GIMS Gestion d'Équipement. Tous droits réservés.</p>
                  <p style="margin: 0;">Ceci est un email automatique. Veuillez ne pas répondre à ce message.</p>
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

module.exports = { generateReservationEmail };