const generateReservationStatusEmail = (data) => {
  const { 
    recipientName, 
    studentName, 
    responsableName, 
    reservationId, 
    equipment, 
    startDate, 
    endDate, 
    status,
    isResponsable
  } = data;
  
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

  // Créer le HTML pour la liste d'équipements
  const equipmentListHTML = equipment.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
    </tr>`
  ).join('');

  // Variables spécifiques au statut
  const isApproved = status === 'validee';
  const statusColor = isApproved ? '#27ae60' : '#e74c3c';
  const statusText = isApproved ? 'Approuvée' : 'Refusée';
  const statusExplanation = isApproved 
    ? 'Votre réservation a été approuvée. Vous pouvez récupérer l\'équipement à la date prévue.'
    : 'Votre réservation a été refusée. Veuillez contacter le support pour plus d\'informations.';
  
  // Contenu spécifique au destinataire
  const messageIntro = isResponsable
    ? `Vous avez ${isApproved ? 'approuvé' : 'refusé'} la demande de réservation suivante de ${studentName}.`
    : `${responsableName} a ${isApproved ? 'approuvé' : 'refusé'} votre demande de réservation d'équipement.`;
    
  const nextSteps = isResponsable
    ? `Un email a été automatiquement envoyé à ${studentName} pour l'informer de cette décision.`
    : (isApproved 
        ? 'Vous pouvez récupérer votre équipement au bureau du technicien pendant les heures d\'ouverture à la date de début. Veuillez apporter votre carte d\'étudiant et mentionner votre numéro de réservation.'
        : 'Si vous avez des questions sur les raisons du refus de votre réservation ou si vous souhaitez soumettre une demande modifiée, veuillez contacter l\'équipe de gestion des équipements.');

  // Modèle HTML avec CSS intégré pour compatibilité des emails
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réservation ${statusText}</title>
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
                  <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-weight: 700; font-size: 24px;">Réservation ${statusText}</h2>
                  <p style="margin-bottom: 25px; color: #666;">
                    Bonjour ${recipientName},<br>
                    ${messageIntro}
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: ${statusColor}; border-radius: 8px;">
                    <tr>
                      <td style="padding: 15px; text-align: center; color: white; font-weight: bold;">
                        Statut de Réservation: ${statusText}
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Détails de la Réservation</h3>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">ID de Réservation:</strong> #${reservationId}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Étudiant:</strong> ${studentName}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Statut:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span></p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Date de Début:</strong> ${formattedStartDate}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Date de Fin:</strong> ${formattedEndDate}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; border-left: 4px solid #6c2bd9; background-color: #f8f9fa; border-radius: 0 8px 8px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Résumé des Équipements</h3>
                        
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
                        <p style="margin: 0;">${nextSteps}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
              <tr>
                <td style="padding: 30px 30px; text-align: center; color: #666; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} GIMS Gestion des Équipements. Tous droits réservés.</p>
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

module.exports = { generateReservationStatusEmail };