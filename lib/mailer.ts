import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendStatusEmail(to: string, fullName: string, jobTitle: string, status: string) {
  
  let subject = "";
  let statusText = "";
  let statusColor = "";
  let nextStep = "";

  switch (status) {
    case "shortlisted":
      subject = `Great news! You were shortlisted for ${jobTitle}`;
      statusText = "Shortlisted";
      statusColor = "#2563eb"; // Blue
      nextStep = "Congratulations! The employer has shortlisted your profile. They will contact you soon for an interview. Good luck!";
      break;
    case "accepted":
      subject = `Congratulations! Your Application for ${jobTitle} was Accepted`;
      statusText = "Accepted";
      statusColor = "#16a34a"; // Green
      nextStep = "The employer will contact you soon with the next steps. Please keep an eye on your inbox.";
      break;
    case "rejected":
      subject = `Update on Your Application for ${jobTitle}`;
      statusText = "Not Selected";
      statusColor = "#dc2626"; // Red
      nextStep = "We encourage you to keep applying. A better opportunity might be waiting for you.";
      break;
    case "pending":
    default:
      subject = `Update on Your Application for ${jobTitle}`;
      statusText = "Under Review";
      statusColor = "#f59e0b"; // Orange
      nextStep = "Your application is currently under review by the employer. We will notify you once there is an update.";
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; }
        .content { padding: 30px; color: #18181b; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: #fff; background-color: ${statusColor}; margin: 15px 0; text-transform: capitalize; }
        .job-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>JobPortal</h1></div>
        <div class="content">
          <h2>Hi ${fullName},</h2>
          <p>We have an update regarding your job application.</p>
          <div class="job-card"><p><strong>Position:</strong> ${jobTitle}</p></div>
          <p><strong>Application Status:</strong></p>
          <span class="status-badge">${statusText}</span>
          <p style="margin-top: 20px;">${nextStep}</p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard/applications" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; margin-top:15px;">View My Applications</a>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} JobPortal</p></div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"JobPortal Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// NEW FUNCTION FOR FORGOT PASSWORD
export async function sendResetEmail(to: string, resetUrl: string, fullName: string = "User") {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f5; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center; }
        .header h1 { color: #fff; margin: 0; }
        .content { padding: 30px; color: #18181b; line-height: 1.6; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #71717a; }
        .button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px; font-size: 13px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>JobPortal</h1></div>
        <div class="content">
          <h2>Hi ${fullName},</h2>
          <p>You requested to reset your password. Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
          <div style="text-align:center">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>If button doesn't work, copy this link:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <div class="warning">
            ⚠️ If you didn't request this, ignore this email. Your password will stay safe.
          </div>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} JobPortal. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"JobPortal Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Your JobPortal Password",
    html,
  });
}