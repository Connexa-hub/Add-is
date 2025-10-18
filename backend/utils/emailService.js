
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

const sendPasswordResetEmail = (user, resetToken) => {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${user.name},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(user.email, 'Password Reset Request', html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTransactionReceipt,
  sendPasswordResetEmail
};
