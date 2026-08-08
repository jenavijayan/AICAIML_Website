import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL || 'https://aic-aiml.org';

function normalizeBaseUrl(url) {
  if (!url) return 'https://aic-aiml.org';
  let input = String(url).trim();
  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }
  try {
    const u = new URL(input);
    if (u.hostname.toLowerCase() === 'www.aic-aiml.org') {
      u.hostname = 'aic-aiml.org';
    }
    u.hash = '';
    u.search = '';
    u.pathname = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return 'https://aic-aiml.org';
  }
}

const BASE_URL = normalizeBaseUrl(SITE_URL);

function formatDate(date) {
  if (!date) return new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const logoUrl = 'https://aicaiml-website.vercel.app/assets/logo-web-TPNlqHKk.png';

function buildWrapper(bodyContent, maxWidth = '760px') {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AICAIML Email</title>
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
                  <td valign="middle" align="right" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#B9C3D4; line-height:1.4; padding-left:12px; white-space:nowrap;"><a href="${BASE_URL}" style="color:#D9A936; text-decoration:none; font-weight:bold;">aic-aiml.org</a></td>
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
}

const FOOTER = `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:28px;">
    <tr>
      <td align="center" style="padding:0 0 24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
          <tr>
            <td width="56" height="56" bgcolor="#F8F5EE" style="background-color:#F8F5EE; width:56px; height:56px; border:1px dashed #C9A24B; border-radius:56px; text-align:center; vertical-align:middle; font-family:Georgia, 'Times New Roman', serif; font-size:9px; font-weight:bold; color:#C9A24B; line-height:1.2; letter-spacing:0.5px; text-transform:uppercase;">
              AICAIML<br>SEAL
            </td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:bold; color:#0E1B33; font-style:italic; padding-bottom:4px;">Membership Board</td>
          </tr>
          <tr>
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#5B6478;">All India Council for Artificial Intelligence &amp; Machine Learning</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const SIGN_OFF = `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:28px;">
    <tr>
      <td align="center" style="padding:0 0 24px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin-bottom:16px;">
          <tr>
            <td width="56" height="56" bgcolor="#F8F5EE" style="background-color:#F8F5EE; width:56px; height:56px; border:1px dashed #C9A24B; border-radius:56px; text-align:center; vertical-align:middle; font-family:Georgia, 'Times New Roman', serif; font-size:9px; font-weight:bold; color:#C9A24B; line-height:1.2; letter-spacing:0.5px; text-transform:uppercase;">
              AICAIML<br>SEAL
            </td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td style="font-family:Georgia, 'Times New Roman', serif; font-size:14px; font-weight:bold; color:#0E1B33; font-style:italic; padding-bottom:4px;">Membership Board</td>
          </tr>
          <tr>
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#5B6478;">All India Council for Artificial Intelligence &amp; Machine Learning</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const HEADER_BRAND = (eyebrowText, eyebrowClass = 'teal') => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
    <tr>
      <td bgcolor="#17A398" style="background-color:#17A398; padding:5px 14px; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:#FFFFFF; text-transform:uppercase; letter-spacing:1px;">
        ${escapeHtml(eyebrowText)}
      </td>
    </tr>
  </table>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
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
            <td style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#B9C3D4; letter-spacing:0.5px;">All India Council for Artificial Intelligence &amp; Machine Learning</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

function buildPanel(title, rows) {
  const rowsHtml = rows.map(row => {
    if (row.type === 'badge') {
      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; margin-bottom:0;">
          <tr>
            <td width="3" bgcolor="${row.borderColor || '#E4DDCB'}" style="background-color:${row.borderColor || '#E4DDCB'}; width:3px; font-size:0; line-height:0;">&nbsp;</td>
            <td style="padding:10px 14px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
                <tr>
                  <td style="font-size:10px; color:#5B6478; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:2px;">${escapeHtml(row.label)}</td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td bgcolor="${row.badgeBg || '#E4F5EC'}" style="background-color:${row.badgeBg || '#E4F5EC'}; padding:5px 12px; border:1px solid #B8DFC8; border-radius:4px;">
                          <span style="font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:bold; color:#0F7A5A; text-transform:uppercase; letter-spacing:0.5px;">${escapeHtml(row.value)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
    }
    const borderColor = row.borderColor || '#E4DDCB';
    return `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; margin-bottom:${row.isLast ? '0' : '12px'};">
        <tr>
          <td width="3" bgcolor="${borderColor}" style="background-color:${borderColor}; width:3px; font-size:0; line-height:0;">&nbsp;</td>
          <td style="padding:10px 14px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;">
              <tr>
                <td style="font-size:10px; color:#5B6478; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:2px;">${escapeHtml(row.label)}</td>
              </tr>
              <tr>
                <td style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#0E1B33;${row.mono ? ' font-family:\'Courier New\', Courier, monospace; font-size:14px; letter-spacing:1px;' : ''}">${escapeHtml(row.value)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }).join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px solid #E4DDCB; margin-bottom:24px;">
      <tr>
        <td style="padding:24px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#1C2333;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:18px;">
            <tr>
              <td style="font-size:11px; font-weight:bold; color:#5B6478; text-transform:uppercase; letter-spacing:1px; padding-bottom:10px; border-bottom:1px solid #E4DDCB;">
                ${escapeHtml(title)}
              </td>
            </tr>
          </table>
          ${rowsHtml}
        </td>
      </tr>
    </table>
  `;
}

function buildActionCard(title, subtitle, buttonText, buttonUrl) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#0E1B33" style="background-color:#0E1B33; margin-bottom:24px;">
      <tr>
        <td style="padding:24px; text-align:center;">
          <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#E7CE8B; line-height:1.4; padding:0;">${escapeHtml(title)}</p>
          <p style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#B8BFCF; line-height:1.5; padding:0;">${escapeHtml(subtitle)}</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
            <tr>
              <td bgcolor="#C9A24B" style="background-color:#C9A24B; padding:14px 28px; border-radius:4px; text-align:center;">
                <a href="${escapeHtml(buttonUrl)}" style="display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#081123; text-decoration:none; text-transform:uppercase; letter-spacing:1px;">${escapeHtml(buttonText)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildOtpBox(label, code, note) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border:1px dashed #C9A24B; border-radius:10px; margin-bottom:24px;">
      <tr>
        <td style="padding:28px 20px; text-align:center; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#1C2333;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:18px;">
            <tr>
              <td style="font-size:11px; font-weight:bold; color:#24466F; text-transform:uppercase; letter-spacing:1.8px; text-align:center;">${escapeHtml(label)}</td>
            </tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td bgcolor="#FCFAF4" style="background-color:#FCFAF4; border:1px dashed #C9A24B; border-radius:10px; padding:14px 20px; text-align:center;">
                <span style="font-family:Arial, Helvetica, sans-serif; font-size:34px; font-weight:600; color:#0E1B33; letter-spacing:8px;">${escapeHtml(code)}</span>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5; text-align:center; padding:0;">${note}</p>
        </td>
      </tr>
    </table>
  `;
}

function buildNotice(text) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:0;">
      <tr>
        <td bgcolor="#FCF8EC" style="background-color:#FCF8EC; border-left:3px solid #C9A24B; padding:14px 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5;">
          ${escapeHtml(text)}
        </td>
      </tr>
    </table>
  `;
}

function buildBadge(text, bgColor, borderColor, textColor) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td bgcolor="${bgColor}" style="background-color:${bgColor}; padding:6px 16px; border:1px solid ${borderColor}; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:${textColor}; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
          ${escapeHtml(text)}
        </td>
      </tr>
    </table>
  `;
}

function buildHeadline(text) {
  return `<h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">${escapeHtml(text)}</h1>`;
}

function buildSubtitle(text) {
  return `<p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">${escapeHtml(text)}</p>`;
}

function buildIntro(userName, mainText) {
  return `
    <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">Dear <strong>${escapeHtml(userName || 'Member')}</strong>,</p>
    <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">${escapeHtml(mainText)}</p>
  `;
}

function membershipApproval({ name, membershipNo, applicationId, membershipType, approvalDate, portalUrl }) {
  const portal = portalUrl || `${BASE_URL}/#member-login`;
  const mType = escapeHtml(membershipType || 'MEMBER');
  const bodyContent = `
    ${buildBadge('Membership Approved', '#E4F5EC', '#B8DFC8', '#0F7A5A')}
    ${buildHeadline('Welcome to the council, ' + name + '.')}
    ${buildSubtitle('Your ' + mType.toLowerCase() + ' membership application has cleared review — you\'re officially part of India\'s AI/ML ecosystem.')}
    ${buildPanel('Approval details', [
      { label: 'Membership ID', value: membershipNo, borderColor: '#C9A24B', mono: true },
      { label: 'Application ID', value: applicationId, borderColor: '#E4DDCB' },
      { label: 'Membership type', value: mType, borderColor: '#E4DDCB' },
      { label: 'Approval date', value: formatDate(approvalDate), borderColor: '#E4DDCB' },
      { label: 'Status', value: 'Active', borderColor: '#17A398', badgeBg: '#E4F5EC' }
    ])}
    ${buildActionCard('Sign in to the member portal', 'Use your approved Google account — no password needed.', 'Go to member login →', portal)}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">We're glad to have you on board. Explore the portal for resources, events, and community updates tailored to ${mType.toLowerCase()} members.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function applicationReceived({ name, applicationId, membershipNo, category, submissionDate, verificationCode }) {
  const cat = escapeHtml(category || 'STUDENT').toUpperCase();
  const bodyContent = `
    ${buildBadge('Application Received', '#FEF3C7', '#E8D5A0', '#92400E')}
    ${buildHeadline('Thanks for applying, ' + name + '.')}
    ${buildSubtitle('Your ' + cat.toLowerCase() + ' membership application is logged securely in our Council database and awaiting verification.')}
    ${buildPanel('Application summary', [
      { label: 'Application ID', value: applicationId, borderColor: '#C9A24B', mono: true },
      { label: 'Allocated membership no.', value: membershipNo, borderColor: '#E4DDCB' },
      { label: 'Category', value: cat, borderColor: '#E4DDCB' },
      { label: 'Submission date', value: formatDate(submissionDate), borderColor: '#E4DDCB' },
      { label: 'Status', value: 'Pending verification', borderColor: '#E4DDCB', badgeBg: '#FBF0DC' }
    ])}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 0 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5;">
          <p style="margin:0 0 8px; font-weight:bold; color:#0E1B33;">Next steps:</p>
          <p style="margin:0 0 6px;">1. Registry check — The Review Committee verifies details.</p>
          <p style="margin:0 0 6px;">2. 3–5 business days — Typical turnaround time.</p>
          <p style="margin:0;">3. Certificate issued — You'll receive your digital certificate.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">We're glad to have you in the pipeline. No action is needed beyond verifying your email.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function verificationCode({ code }) {
  const bodyContent = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td bgcolor="#E5F1EE" style="background-color:#E5F1EE; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:#159A9C; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
          Verify Your Identity
        </td>
      </tr>
    </table>
    <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">Your verification code</h1>
    <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#52627A; line-height:1.5; text-align:center; padding:0;">Enter this code to confirm it's really you.</p>
    ${buildOtpBox('One-Time Code', code, 'Valid for <strong>10 minutes</strong> from the time this was sent.')}
    ${buildNotice('Didn\'t request this code? You can safely ignore this message — your account stays secure and no changes will be made without it.')}
  `;
  return buildWrapper(bodyContent);
}

function paymentConfirmation({ name, planName, price, paymentId, membershipNo, paymentRef, paidAt }) {
  const bodyContent = `
    ${buildBadge('Payment Confirmed', '#E4F5EC', '#B8DFC8', '#0F7A5A')}
    ${buildHeadline('Payment received, ' + name + '.')}
    ${buildSubtitle('Your ' + planName + ' membership is now active. Welcome to the AICAIML network.')}
    ${buildPanel('Payment receipt', [
      { label: 'Transaction ID', value: paymentId, borderColor: '#C9A24B', mono: true },
      { label: 'Membership No', value: membershipNo, borderColor: '#E4DDCB', mono: true },
      { label: 'Plan', value: planName, borderColor: '#E4DDCB' },
      { label: 'Amount paid', value: 'INR ' + price + ' (Annual)', borderColor: '#E4DDCB' },
      { label: 'Payment method', value: paymentRef, borderColor: '#E4DDCB' },
      { label: 'Date', value: formatDate(paidAt), borderColor: '#E4DDCB' },
      { label: 'Status', value: 'Active', borderColor: '#17A398', badgeBg: '#E4F5EC' }
    ])}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">Your membership is now active. Login credentials for the member learning portal will be issued to this email shortly.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function enquiryReceived({ name, enquiryId, message }) {
  const bodyContent = `
    ${buildBadge('Enquiry Received', '#E4F5EC', '#B8DFC8', '#0F7A5A')}
    ${buildHeadline('Thank you, ' + name + '.')}
    ${buildSubtitle('Your message has been received by the AICAIML executive team.')}
    ${buildPanel('Enquiry details', [
      { label: 'Reference ID', value: enquiryId, borderColor: '#C9A24B', mono: true },
      { label: 'Message', value: message, borderColor: '#E4DDCB' }
    ])}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">A representative from our executive team will review your message and get back to you within 2 business days.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function membershipRejection({ name, membershipType, applicationId, reason }) {
  const mType = escapeHtml(membershipType || 'MEMBER').toUpperCase();
  const bodyContent = `
    ${buildBadge('Application Update', '#FEF3C7', '#E8D5A0', '#92400E')}
    ${buildHeadline('Application update for ' + name + '.')}
    ${buildSubtitle('Your AICAIML ' + mType.toLowerCase() + ' membership application has been reviewed.')}
    <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6;">Thank you for your interest in AICAIML ${mType} membership. After careful review by the Membership Board, we regret to inform you that your application (Ref: ${escapeHtml(applicationId)}) has been marked as <strong>Rejected</strong>.</p>
    ${reason ? buildPanel('Rejection reason', [{ label: 'Reason', value: reason, borderColor: '#C9A24B' }]) : ''}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">If you believe this decision was made in error, contact our Membership Office at support@aic-aiml.org.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function credentialsIssued({ name, username, tempPassword, loginUrl }) {
  const url = loginUrl || `${BASE_URL}/login`;
  const bodyContent = `
    ${buildBadge('Credentials Issued', '#E4F5EC', '#B8DFC8', '#0F7A5A')}
    ${buildHeadline('Your member portal is ready, ' + name + '.')}
    ${buildSubtitle('Your AICAIML member portal account has been created. Use the credentials below to sign in.')}
    ${buildPanel('Portal credentials', [
      { label: 'Username', value: username, borderColor: '#C9A24B', mono: true },
      { label: 'Temporary password', value: tempPassword, borderColor: '#17A398', mono: true },
      { label: 'Login URL', value: url, borderColor: '#E4DDCB', mono: true }
    ])}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">Please log in and change your password immediately. Welcome to AICAIML!</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function passwordReset({ name, resetUrl }) {
  const bodyContent = `
    ${buildBadge('Password Reset', '#E4F5EC', '#B8DFC8', '#0F7A5A')}
    ${buildHeadline('Reset your password, ' + name + '.')}
    ${buildSubtitle('You requested a password reset for your AICAIML member portal account.')}
    ${buildActionCard('Reset your password', 'This link is valid for a limited time.', 'Reset password →', resetUrl)}
    <p style="margin:0 0 34px 0; font-family:Arial, Helvetica, sans-serif; font-size:14.5px; line-height:1.7; color:#5B6478;">If you did not request this, you can safely ignore this message — your account stays secure.</p>
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

function adminNotification({ title, message }) {
  const bodyContent = `
    ${buildBadge('Admin Notification', '#FEF3C7', '#E8D5A0', '#92400E')}
    ${buildHeadline(title)}
    <p style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6;">Internal notification for the AICAIML council secretariat.</p>
    ${buildPanel('Notification details', [{ label: 'Message', value: message, borderColor: '#C9A24B' }])}
    ${FOOTER}
  `;
  return buildWrapper(bodyContent);
}

/**
 * Wraps content in the Master Template
 */
function wrapEmail(userName, headline, mainText, actionHtml = "") {
    const templatePath = path.join(process.cwd(), 'server-lib', 'email-templates', 'master-template.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    const bodyContent = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td bgcolor="#E5F1EE" style="background-color:#E5F1EE; padding:6px 16px; border:1px solid #78CFC4; border-radius:12px; font-family:Arial, Helvetica, sans-serif; font-size:11px; font-weight:bold; color:#159A9C; text-transform:uppercase; letter-spacing:1.5px; text-align:center;">
              Verify Your Identity
            </td>
          </tr>
        </table>

        <h1 style="margin:0 0 10px 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; font-weight:700; color:#0E1B33; line-height:1.3; text-align:center; padding:0;">
          ${escapeHtml(headline)}
        </h1>

        <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
          Dear <strong>${escapeHtml(userName || 'Member')}</strong>,
        </p>
        <p style="margin:0 0 28px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; color:#1C2333; line-height:1.6; padding:0;">
          ${escapeHtml(mainText)}
        </p>

        ${actionHtml}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:0;">
          <tr>
            <td bgcolor="#FCF8EC" style="background-color:#FCF8EC; border-left:3px solid #C9A24B; padding:14px 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#52627A; line-height:1.5;">
              Didn't request this code? You can safely ignore this message — your account stays secure and no changes will be made without it.
            </td>
          </tr>
        </table>
    `;

    return template
        .replace('{{USER_NAME}}', userName || 'Member')
        .replace('{{BODY_CONTENT}}', bodyContent);
}

export {
  wrapEmail,
  BASE_URL,
  escapeHtml,
  formatDate,
  membershipApproval,
  applicationReceived,
  verificationCode,
  paymentConfirmation,
  enquiryReceived,
  membershipRejection,
  credentialsIssued,
  passwordReset,
  adminNotification
};
