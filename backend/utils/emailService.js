
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

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTransactionReceipt,
  sendPasswordResetEmail,
  sendVerificationEmail
};
