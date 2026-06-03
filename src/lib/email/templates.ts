// src/lib/email/templates.ts

interface TemplateParams {
  recipientName: string;
  companyName?: string;
  actionUrl?: string;
  expiryHours?: number;
  supportEmail?: string;
  otpCode?: string;
  customMessage?: string;
}

// Helper to wrap content in a premium layout with HSL-tailored colors
function baseHtmlLayout(title: string, bodyContent: string, actionUrl?: string, actionText?: string, supportEmail = "support@visatek-erp.com"): string {
  const buttonHtml = actionUrl && actionText
    ? `
      <div style="margin: 30px 0; text-align: center;">
        <a href="${actionUrl}" style="background-color: hsl(220, 90%, 56%); color: #ffffff; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); font-family: 'Outfit', 'Inter', Helvetica, sans-serif; transition: all 0.2s ease;">
          ${actionText}
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        body {
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          font-family: 'Inter', Helvetica, Arial, sans-serif;
          color: #334155;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, hsl(220, 95%, 45%), hsl(220, 90%, 56%));
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-family: 'Outfit', 'Inter', sans-serif;
          font-size: 24px;
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .content p {
          font-size: 16px;
          margin: 0 0 20px 0;
          color: #475569;
        }
        .content strong {
          color: #0f172a;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 24px 30px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer a {
          color: hsl(220, 90%, 56%);
          text-decoration: none;
        }
        .action-link {
          word-break: break-all;
          font-size: 13px;
          color: #64748b;
          background-color: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VisaTek ERP</h1>
        </div>
        <div class="content">
          ${bodyContent}
          ${buttonHtml}
          ${actionUrl ? `
            <div class="action-link">
              <strong>Button not working?</strong> Copy and paste this URL into your browser:<br/>
              <a href="${actionUrl}" style="color: hsl(220, 90%, 56%); text-decoration: none;">${actionUrl}</a>
            </div>
          ` : ""}
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;">This is an automated system email from VisaTek ERP.</p>
          <p style="margin: 0;">Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Company owner activation email
export function getCompanyOwnerActivationEmail(params: TemplateParams) {
  const { recipientName, companyName, actionUrl, expiryHours = 24, supportEmail } = params;
  const html = baseHtmlLayout(
    "Activate Your Workspace",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Your application for <strong>${companyName}</strong> has been approved! We are excited to welcome you to the VisaTek ERP platform.</p>
      <p>Please click the button below to set your password and activate your company owner account. This activation link is valid for <strong>${expiryHours} hours</strong>.</p>
    `,
    actionUrl,
    "Activate Account",
    supportEmail
  );
  const text = `Hello ${recipientName},\n\nYour application for ${companyName} has been approved!\n\nPlease visit the following link to set your password and activate your account (valid for ${expiryHours} hours):\n\n${actionUrl}\n\nNeed help? Support: ${supportEmail || "support@visatek-erp.com"}`;
  return { html, text, subject: `Welcome to VisaTek ERP! Activate ${companyName}` };
}

// 2. Company user invitation email
export function getCompanyUserInvitationEmail(params: TemplateParams) {
  const { recipientName, companyName, actionUrl, expiryHours = 24, supportEmail } = params;
  const html = baseHtmlLayout(
    "Invitation to Join Team",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>You have been invited to join the <strong>${companyName}</strong> team on VisaTek ERP.</p>
      <p>Please click the button below to set your password and accept the invitation. This invitation link is valid for <strong>${expiryHours} hours</strong>.</p>
    `,
    actionUrl,
    "Accept Invitation & Set Password",
    supportEmail
  );
  const text = `Hello ${recipientName},\n\nYou have been invited to join the ${companyName} team on VisaTek ERP.\n\nPlease visit the following link to accept the invitation and set your password (valid for ${expiryHours} hours):\n\n${actionUrl}\n\nNeed help? Support: ${supportEmail || "support@visatek-erp.com"}`;
  return { html, text, subject: `Invitation to join ${companyName} on VisaTek ERP` };
}

// 3. Password reset / activation link email
export function getPasswordResetEmail(params: TemplateParams) {
  const { recipientName, actionUrl, expiryHours = 24, supportEmail } = params;
  const html = baseHtmlLayout(
    "Reset Your Password",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>We received a request to reset your password for your VisaTek ERP account.</p>
      <p>Please click the button below to set a new password. This reset link is valid for <strong>${expiryHours} hours</strong>. If you did not request a password reset, you can safely ignore this email.</p>
    `,
    actionUrl,
    "Reset Password",
    supportEmail
  );
  const text = `Hello ${recipientName},\n\nWe received a request to reset your password.\n\nPlease visit the following link to choose a new password (valid for ${expiryHours} hours):\n\n${actionUrl}\n\nIf you did not request this, please ignore this email.\n\nSupport: ${supportEmail || "support@visatek-erp.com"}`;
  return { html, text, subject: "Reset your VisaTek ERP Password" };
}

// 4. Password changed alert email
export function getPasswordChangedAlertEmail(params: TemplateParams) {
  const { recipientName, supportEmail } = params;
  const html = baseHtmlLayout(
    "Security Alert: Password Changed",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>This is a security notification to confirm that the password for your VisaTek ERP account was recently changed.</p>
      <p><strong>If you performed this change</strong>, no further action is required.</p>
      <p><strong>If you did NOT perform this change</strong>, please contact our support team immediately or request a password reset right away to secure your account.</p>
    `,
    undefined,
    undefined,
    supportEmail
  );
  const text = `Hello ${recipientName},\n\nThis is a security notification confirming your VisaTek ERP password was changed.\n\nIf you did this, you can ignore this email. If not, contact support immediately at ${supportEmail || "support@visatek-erp.com"}.`;
  return { html, text, subject: "Security Alert: VisaTek ERP Password Changed" };
}

// 5. Generic notification email template
export function getGenericNotificationEmail(params: TemplateParams) {
  const { recipientName, customMessage, actionUrl, supportEmail } = params;
  const html = baseHtmlLayout(
    "Notification Update",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>${customMessage}</p>
    `,
    actionUrl,
    actionUrl ? "View Details" : undefined,
    supportEmail
  );
  const text = `Hello ${recipientName},\n\n${customMessage}\n\n${actionUrl ? `View Details: ${actionUrl}\n\n` : ""}Support: ${supportEmail || "support@visatek-erp.com"}`;
  return { html, text, subject: "VisaTek ERP Notification" };
}

// 6. Future OTP email template
export function getOtpEmail(params: TemplateParams) {
  const { recipientName, otpCode, expiryHours = 1, supportEmail } = params;
  const html = baseHtmlLayout(
    "Your One-Time Verification Code",
    `
      <p>Hello <strong>${recipientName}</strong>,</p>
      <p>Use the following one-time code to complete your verification. This code is valid for <strong>${expiryHours} hour</strong>.</p>
      <div style="margin: 30px 0; text-align: center;">
        <span style="font-family: monospace; font-size: 36px; font-weight: 700; color: hsl(220, 95%, 45%); letter-spacing: 4px; padding: 12px 24px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">
          ${otpCode}
        </span>
      </div>
      <p>If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized access.</p>
    `,
    undefined,
    undefined,
    supportEmail
  );
  const text = `Hello ${recipientName},\n\nYour one-time verification code is: ${otpCode} (valid for ${expiryHours} hour).\n\nIf you did not request this, please ignore this email.\n\nSupport: ${supportEmail || "support@visatek-erp.com"}`;
  return { html, text, subject: `${otpCode} is your VisaTek ERP verification code` };
}
