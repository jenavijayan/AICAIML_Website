const fs = require('fs');
const path = require('path');

/**
 * Generates bulletproof table-based HTML for emails
 * @param {string} type - 'OTP', 'ENQUIRY', 'MEMBERSHIP', 'WELCOME'
 * @param {object} data - Object containing name, code, etc.
 */
function generateEmailHtml(type, data) {
    const logoUrl = 'https://aicaiml-website.vercel.app/assets/logo-web-TPNlqHKk.png';
    const baseUrl = 'https://www.aic-aiml.org';
    
    // Common wrapper with legacy bgcolor attributes
    const wrapper = (bodyContent) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AICAIML - Email</title>
</head>
<body style="margin:0; padding:0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#DCD6C6" style="background-color:#DCD6C6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#F8F5EE" style="background-color:#F8F5EE; border:1px solid #E4DDCB;">
          
          <!-- TOP ACCENT STRIPE -->
          <tr>
            <td style="padding:0; font-size:0; line-height:0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="200" height="6" bgcolor="#0E1B33" style="background-color:#0E1B33; font-size:0; line-height:0; height:6px; mso-line-height-rule:exactly;">&nbsp;</td>
                  <td width="200" height="6" bgcolor="#C9A24B" style="background-color:#C9A24B; font-size:0; line-height:0; height:6px; mso-line-height-rule:exactly;">&nbsp;</td>
                  <td width="200" height="6" bgcolor="#17A398" style="background-color:#17A398; font-size:0; line-height:0; height:6px; mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td bgcolor="#0E1B33" style="background-color:#0E1B33; padding:28px 32px 28px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="middle" width="44" style="width:44px;">
                    <img src="${logoUrl}" alt="AICAIML Logo" width="44" height="44" style="display:block; border:0; outline:none; text-decoration:none;" />
                  </td>
                  <td valign="middle" style="padding-left:14px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; color:#D9A936; letter-spacing:2px; text-transform:uppercase; padding-bottom:2px;">AICAIML</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#B9C3D4; letter-spacing:0.5px;">Council verification</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td bgcolor="#F8F5EE" style="background-color:#F8F5EE; padding:36px 32px 32px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#0E1B33" style="background-color:#0E1B33; padding:16px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td valign="middle" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#B9C3D4; line-height:1.4; padding-right:12px;">AICAIML &middot; India's premier AI/ML ecosystem</td>
                  <td valign="middle" align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#B9C3D4; line-height:1.4; padding-left:12px; white-space:nowrap;"><a href="${baseUrl}" style="color:#D9A936; text-decoration:none; font-weight:bold;">aic-aiml.org</a></td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 2. Set Default Styles/Content
    let tagBg = "#E0F2FE", tagColor = "#0369A1", eyebrow = "Notification";
    let actionHtml = "";
    let headline = data.headline || "Notice from AICAIML";
    let bodyContent = "";

    // 3. Customize based on Email Type
    switch (type) {
        case 'OTP':
            eyebrow = "Security Verification";
            tagBg = "#FEF3C7"; tagColor = "#92400E";
            headline = "Your Verification Code";
            bodyContent = `
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
                Dear <strong>${escapeHtml(data.userName || 'Member')}</strong>,
              </p>
              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
                ${escapeHtml(data.mainBody || 'Enter this code on the verification page to confirm your identity.')}
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td bgcolor="#E5F1EE" style="background-color:#E5F1EE; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:#159A9C; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
                    Verify Your Identity
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">
                Your verification code
              </h1>

              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">
                Enter this code to confirm it's really you.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px dashed #C9A24B; border-radius:10px; margin-bottom:24px;">
                <tr>
                  <td style="padding:28px 20px; text-align:center; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#1C2333;">

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:18px;">
                      <tr>
                        <td style="font-size:11px; font-weight:bold; color:#24466F; text-transform:uppercase; letter-spacing:1.8px; text-align:center;">
                          One-Time Code
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td bgcolor="#FCFAF4" style="background-color:#FCFAF4; border:1px dashed #C9A24B; border-radius:10px; padding:14px 20px; text-align:center;">
                          <span style="font-family:Arial, Helvetica, sans-serif; font-size:34px; font-weight:600; color:#0E1B33; letter-spacing:8px;">${data.otp || ''}</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:16px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5; text-align:center; padding:0;">
                      Valid for 10 minutes from the time this was sent.
                    </p>

                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:0;">
                <tr>
                  <td bgcolor="#FCF8EC" style="background-color:#FCF8EC; border-left:3px solid #C9A24B; padding:14px 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5;">
                    Didn't request this code? You can safely ignore this message — your account stays secure and no changes will be made without it.
                  </td>
                </tr>
              </table>
            `;
            break;

        case 'ENQUIRY':
            eyebrow = "Enquiry Received";
            tagBg = "#E4F5EC"; tagColor = "#0F7A5A";
            headline = "Thank you for reaching out";
            bodyContent = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td bgcolor="${tagBg}" style="background-color:${tagBg}; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:${tagColor}; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
                    ${eyebrow}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">
                ${headline}
              </h1>

              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">
                Dear ${escapeHtml(data.userName || 'Member')},
              </p>

              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
                ${escapeHtml(data.mainBody || 'You have received a new notification regarding your AICAIML account.')}
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #E4DDCB; margin-bottom:24px;">
                <tr>
                  <td style="padding:24px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#1C2333;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
                      <tr>
                        <td style="font-size:11px; font-weight:bold; color:#5B6478; text-transform:uppercase; letter-spacing:1px; padding-bottom:8px; border-bottom:1px solid #E4DDCB;">
                          Enquiry Details
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; margin-bottom:12px;">
                      <tr>
                        <td width="3" bgcolor="#C9A24B" style="background-color:#C9A24B; width:3px; font-size:0; line-height:0;">&nbsp;</td>
                        <td style="padding:8px 12px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
                            <tr>
                              <td style="font-size:10px; color:#5B6478; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:2px;">Message</td>
                            </tr>
                            <tr>
                              <td style="font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#0E1B33; line-height:1.5;">${escapeHtml(data.messageContent || data.mainBody || '')}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:0;">
                <tr>
                  <td bgcolor="#FCF8EC" style="background-color:#FCF8EC; border-left:3px solid #C9A24B; padding:14px 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5;">
                    A representative from our executive team will review your message and get back to you within 2 business days.
                  </td>
                </tr>
              </table>
            `;
            break;

        case 'MEMBERSHIP':
            eyebrow = "Membership Update";
            tagBg = "#E4F5EC"; tagColor = "#0F7A5A";
            headline = "Enrollment Processing";
            bodyContent = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td bgcolor="${tagBg}" style="background-color:${tagBg}; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:${tagColor}; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
                    ${eyebrow}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">
                ${headline}
              </h1>

              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">
                Dear ${escapeHtml(data.userName || 'Member')},
              </p>

              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
                ${escapeHtml(data.mainBody || 'Your membership application is being processed.')}
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#0E1B33" style="background-color:#0E1B33; margin-bottom:24px;">
                <tr>
                  <td style="padding:24px; text-align:center;">
                    <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#E7CE8B; line-height:1.4; padding:0;">
                      Member Login
                    </p>
                    <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#B8BFCF; line-height:1.5; padding:0;">
                      Access your dashboard, certificates, and exclusive resources.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td bgcolor="#C9A24B" style="background-color:#C9A24B; padding:14px 28px; border-radius:4px; text-align:center;">
                          <a href="https://www.aic-aiml.org/#member-login" style="display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#081123; text-decoration:none; text-transform:uppercase; letter-spacing:1px;">
                            Member Login
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `;
            break;

        default:
            bodyContent = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td bgcolor="${tagBg}" style="background-color:${tagBg}; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:${tagColor}; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
                    ${eyebrow}
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">
                ${headline}
              </h1>

              <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">
                Dear ${escapeHtml(data.userName || 'Member')},
              </p>

              <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
                ${escapeHtml(data.mainBody || 'You have received a new notification regarding your AICAIML account.')}
              </p>
            `;
    }

    // 4. Replace placeholders and return
    return wrapper(bodyContent)
        .replace('{{TAG_BG}}', tagBg)
        .replace('{{TAG_COLOR}}', tagColor)
        .replace('{{EYEBROW_TEXT}}', eyebrow)
        .replace('{{HEADLINE}}', headline)
        .replace('{{USER_NAME}}', data.userName || 'Member')
        .replace('{{MAIN_CONTENT_HTML}}', data.mainBody || 'You have received a new notification regarding your AICAIML account.')
        .replace('{{ACTION_SECTION_HTML}}', actionHtml);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

module.exports = { generateEmailHtml };
