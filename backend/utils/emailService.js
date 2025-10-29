const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured - skipping email');
      return { success: false, message: 'Email not configured' };
    }

    const mailOptions = {
      from: `"VTU Bill Payment" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = (user) => {
  const html = `
    <h2>Welcome to VTU Bill Payment!</h2>
    <p>Hi ${user.name},</p>
    <p>Thank you for registering. Your account is now active.</p>
    <p>Start by funding your wallet to enjoy seamless bill payments.</p>
    <br>
    <p>Best regards,<br>VTU Bill Payment Team</p>
  `;
  return sendEmail(user.email, 'Welcome to VTU Bill Payment', html);
};

const sendTransactionReceipt = (user, transaction) => {
  const html = `
    <h2>Transaction Receipt</h2>
    <p>Hi ${user.name},</p>
    <p><strong>Transaction Details:</strong></p>
    <ul>
      <li>Type: ${transaction.category}</li>
      <li>Amount: ₦${transaction.amount.toLocaleString()}</li>
      <li>Status: ${transaction.status}</li>
      <li>Reference: ${transaction.reference}</li>
      <li>Date: ${new Date(transaction.createdAt).toLocaleString()}</li>
    </ul>
    <p>Thank you for using our service!</p>
  `;
  return sendEmail(user.email, 'Transaction Receipt', html);
};

const sendPasswordResetEmail = (user, otp) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>You requested a password reset. Use the verification code below to reset your password:</p>
    <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
    <p>This code expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>VTU Bill Payment Team</p>
  `;
  return sendEmail(user.email, 'Password Reset Code', html);
};

const sendVerificationEmail = (user, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to VTU Bill Payment!</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for creating an account. To complete your registration, please verify your email address using the code below:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #333;">${otp}</h1>
      </div>
      <p style="color: #666;">This verification code expires in 1 hour.</p>
      <p style="color: #666;">If you didn't create this account, please ignore this email.</p>
      <br>
      <p>Best regards,<br><strong>VTU Bill Payment Team</strong></p>
    </div>
  `;
  return sendEmail(user.email, 'Verify Your Email Address', html);
};

const sendAccountDeletionEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@addis.com',
    to: user.email,
    subject: 'Account Deletion Confirmation - Addis',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .info-box { background: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deleted</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>

            <p>This email confirms that your Addis account has been permanently deleted as per your request.</p>

            <div class="info-box">
              <h3>What has been deleted:</h3>
              <ul>
                <li>✓ Your account and personal information</li>
                <li>✓ All transaction history</li>
                <li>✓ Saved payment cards</li>
                <li>✓ Notifications and preferences</li>
                <li>✓ Support tickets</li>
                <li>✓ Cashback records</li>
              </ul>
            </div>

            ${user.monnifyAccountReference ? `
            <div class="info-box">
              <h3>Virtual Account Information:</h3>
              <p>Your Monnify virtual account(s) will be automatically deactivated after 90 days of inactivity. Please do not send money to these accounts anymore:</p>
              ${user.monnifyAccounts?.map(acc => `
                <p><strong>${acc.bankName}:</strong> ${acc.accountNumber}</p>
              `).join('') || ''}
            </div>
            ` : ''}

            <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>

            <p>If you did not request this deletion, please contact our support team immediately at support@addis.com</p>

            <p>Thank you for using Addis.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Addis. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Account deletion email sent to:', user.email);
  } catch (error) {
    console.error('Error sending account deletion email:', error);
    throw error;
  }
};


module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTransactionReceipt,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendAccountDeletionEmail
};