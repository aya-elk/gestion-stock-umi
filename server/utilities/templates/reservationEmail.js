/**
 * Email Template Generator for Reservation Confirmations
 * Creates a responsive email template for equipment reservation submissions
 */

/**
 * Generates an HTML email template for reservation confirmations
 * @param {Object} data - The reservation data
 * @param {string} data.studentName - Student's full name
 * @param {string} data.reservationId - The reservation ID
 * @param {Array} data.equipment - List of equipment items reserved
 * @param {string} data.startDate - Start date of the reservation
 * @param {string} data.endDate - End date of the reservation
 * @returns {string} HTML email content
 */
const generateReservationEmail = (data) => {
  const { studentName, reservationId, equipment, startDate, endDate } = data;
  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create equipment list HTML
  const equipmentListHTML = equipment.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
    </tr>`
  ).join('');

  // HTML template with inline CSS for email compatibility
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Equipment Reservation Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; color: #333; background-color: #f5f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0;">
            <!-- Header with gradient -->
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 30px 0; text-align: center; background: linear-gradient(135deg, #6c2bd9, #ff6a00);">
                  <div style="display: inline-block;">
                    <img src="http://localhost:3000/favicon.svg" alt="GP Logo" style="vertical-align: middle; height: 32px; margin-right: 10px;">
                    <h1 style="color: white; font-size: 28px; margin: 0; letter-spacing: -0.02em; font-weight: 800; display: inline-block; vertical-align: middle;">GP<span style="color: white; font-size: 32px;">.</span></h1>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Main content -->
            <table role="presentation" style="max-width: 600px; margin: 20px auto; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);">
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-weight: 700; font-size: 24px;">Equipment Reservation Confirmation</h2>
                  <p style="margin-bottom: 25px; color: #666;">
                    Hello ${studentName},<br>
                    Thank you for your equipment reservation. Your request has been received and is currently <strong>awaiting approval</strong>.
                  </p>
                  
                  <!-- Reservation Details Section -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #f8f9fa; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Reservation Details</h3>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Reservation ID:</strong> #${reservationId}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Status:</strong> <span style="color: #f39c12; font-weight: 600;">Pending Approval</span></p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">Start Date:</strong> ${formattedStartDate}</p>
                        <p style="margin-bottom: 10px;"><strong style="color: #333;">End Date:</strong> ${formattedEndDate}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Equipment List Section -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; border-left: 4px solid #6c2bd9; background-color: #f8f9fa; border-radius: 0 8px 8px 0;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="color: #6c2bd9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Equipment Summary</h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                          <thead>
                            <tr>
                              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Equipment</th>
                              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${equipmentListHTML}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Next Steps Section -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                    <tr>
                      <td style="padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
                        <h3 style="color: #2980b9; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Next Steps</h3>
                        <p style="margin: 0 0 10px 0;">Your reservation request will be reviewed by a responsible staff member. You will receive another notification when your request is approved or rejected.</p>
                        <p style="margin: 0;">If approved, you can collect your equipment from the technician's office during operating hours. Please bring your student ID and mention your reservation number.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
              <tr>
                <td style="padding: 30px 30px; text-align: center; color: #666; font-size: 14px;">
                  <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} GP Equipment Management. All rights reserved.</p>
                  <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
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