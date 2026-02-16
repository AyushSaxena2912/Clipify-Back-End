import { Router } from "express";
import { register, login, forgotPassword, resetPassword } from "./auth.controller";
import { changePassword } from "./auth.controller";
import { authenticate } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/change-password", authenticate, changePassword);

export default router;