import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const emailService = {
  sendVerificationEmail: async (email: string, link: string) => {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${link}">Verify Email</a>
      `,
    });
  },

  sendPasswordResetEmail: async (email: string, link: string) => {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - LinkFlow",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#3db19c;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a></p>
        <p>This link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
      `,
    });
  },
};

