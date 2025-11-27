// food-del/backend/routes/userRoute.js
import express from "express";
import { loginWithPhone, me } from "../controllers/userController.js";

const router = express.Router();

// Dev-only helper: direct phone login without OTP
router.post("/login", loginWithPhone);

// Example "me" route
router.get("/me", me);

export default router;
