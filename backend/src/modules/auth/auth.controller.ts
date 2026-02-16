import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "./auth.service";
import { generateToken } from "../../utils/jwt";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../../db/pool";
import { sendOTPEmail } from "../../utils/mailer";
import { AuthRequest } from "./auth.middleware"; // ✅ ADD THIS
import {
  checkLoginAttempts,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../utils/loginRateLimiter";

/* ---------------------- */
/* REGISTER               */
/* ---------------------- */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await createUser(name, email, password);

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      success: true,
      token,
      user,
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ---------------------- */
/* LOGIN                  */
/* ---------------------- */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user || user.provider !== "local") {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
const allowed = await checkLoginAttempts(email);

if (!allowed) {
  return res.status(429).json({
    success: false,
    message: "Too many failed attempts. Try again after 30 minutes.",
  });
}
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await recordFailedLogin(email);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
await resetLoginAttempts(email);
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

/* ---------------------- */
/* FORGOT PASSWORD        */
/* ---------------------- */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO password_resets (id, user_id, token, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [uuidv4(), user.id, hashedOTP, expiresAt]
    );

    await sendOTPEmail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent to email",
    });

  } catch (error) {
    console.error("FORGOT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ---------------------- */
/* RESET PASSWORD         */
/* ---------------------- */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

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
        message: "Invalid request",
      });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const isMatch = await bcrypt.compare(otp, record.token);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, user.id]
    );

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

/* ---------------------- */
/* CHANGE PASSWORD        */
/* ---------------------- */
export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

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

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

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