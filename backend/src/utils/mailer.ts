import nodemailer from "nodemailer";

export const sendOTPEmail = async(email: string, otp: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
           user: process.env.MAIL_USER,
           pass: process.env.MAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Clipify Supoort"<${process.env.MAIL_USER}`,
        to: email,
        subject: "Password Reset OTP",
        html:  `
      <h2>Password Reset Request</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
    `,
        
    });
};