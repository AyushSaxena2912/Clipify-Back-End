import { OAuth2Client } from "google-auth-library";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "./auth.service";
import { generateToken } from "../../utils/jwt";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../../db/pool";
import { sendOTPEmail } from "../../utils/mailer";
import crypto from "crypto";
import { AuthRequest } from "./auth.middleware"; 
import {
  checkLoginAttempts,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../utils/loginRateLimiter";


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



//  VALIDATION HELPERS
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string): boolean => {
  /*
    Rules:
    - 8–15 characters
    - 1 uppercase
    - 1 lowercase
    - 1 number
    - 1 special character (@$!%*?&)
  */
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,15}$/;

  return passwordRegex.test(password);
};



// REGISTER 
export const register = async (req: Request, res: Response) => {
  try {
    let { name, email, password, confirmPassword } = req.body;

    // Required Fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Trim values
    name = name.trim();
    email = email.trim().toLowerCase();

    // Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Password match validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Strong password validation
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-15 characters long and include uppercase, lowercase, number and special character",
      });
    }

    // Check existing user
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user (password hashing happens inside createUser)
    const user = await createUser(name, email, password);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};






// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;

    // Required fields check
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check login attempts limit
    const allowed = await checkLoginAttempts(email);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Try again after 30 minutes.",
      });
    }

    // Find user
    const user = await findUserByEmail(email);

    // Generic error to prevent user enumeration
    if (!user || user.provider !== "local") {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await recordFailedLogin(email);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset failed attempts after success
    await resetLoginAttempts(email);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};







// FORGOT PASSWORD        
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;

    // 🔹 Required check
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const user = await findUserByEmail(email);

    // Prevent user enumeration + block Google users
    if (!user || user.provider !== "local") {
      return res.json({
        success: true,
        message: "If the email exists, an OTP has been sent",
      });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash OTP before storing
    const hashedOTP = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this user
    await pool.query(
      `DELETE FROM password_resets WHERE user_id = $1`,
      [user.id]
    );

    // Insert new OTP
    await pool.query(
      `
      INSERT INTO password_resets (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [uuidv4(), user.id, hashedOTP, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.json({
      success: true,
      message: "If the email exists, an OTP has been sent",
    });

  } catch (error) {
    console.error("FORGOT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





// RESET PASSWORD        
export const resetPassword = async (req: Request, res: Response) => {
  try {
    let { email, otp, newPassword, confirmPassword } = req.body;

    // Required check
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Password match check
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Strong password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,15}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-15 characters long and include uppercase, lowercase, number and special character",
      });
    }

    const user = await findUserByEmail(email);

    // Prevent enumeration + block Google users
    if (!user || user.provider !== "local") {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Get latest OTP
    const result = await pool.query(
      `
      SELECT * FROM password_resets
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [user.id]
    );

    const record = result.rows[0];

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Expiry check
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, record.token);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, user.id]
    );

    // Delete used OTP
    await pool.query(
      `DELETE FROM password_resets WHERE user_id = $1`,
      [user.id]
    );

    return res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("RESET ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};






// CHANGE PASSWORD    
export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.userId;

    // Auth check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Match check
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Strong password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,15}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8-15 characters long and include uppercase, lowercase, number and special character",
      });
    }

    // Get current password
    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Prevent reuse of same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as old password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};





// GOOGLE LOGIN          
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    const { email, name, picture } = payload;

    // Check if user exists
    let user = await findUserByEmail(email);

    if (!user) {
      // Create Google user
      const result = await pool.query(
        `
        INSERT INTO users (id, name, email, provider)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email
        `,
        [uuidv4(), name, email, "google"]
      );

      user = result.rows[0];
    }

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: "google",
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};