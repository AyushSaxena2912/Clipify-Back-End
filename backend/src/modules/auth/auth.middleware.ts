import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* --------------------------- */
/* JWT PAYLOAD TYPE            */
/* --------------------------- */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/* --------------------------- */
/* EXTENDED REQUEST TYPE       */
/* --------------------------- */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/* --------------------------- */
/* AUTH MIDDLEWARE             */
/* --------------------------- */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};