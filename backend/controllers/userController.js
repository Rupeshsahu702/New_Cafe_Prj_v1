// food-del/backend/controllers/userController.js
// Firebase-free user controller. OTP handles primary login.

import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Utility for signing app JWTs
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

// Direct login by phone (DEV ONLY, skip in production)
const loginWithPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      return res.json({ success: false, message: "Phone number required in +E.164 format." });
    }

    let user = await userModel.findOne({ phoneNumber });
    if (!user) user = await userModel.create({ phoneNumber });

    const token = signToken(user._id);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("loginWithPhone error:", err);
    return res.json({ success: false, message: "Login failed" });
  }
};

// Example protected route helper
const me = async (req, res) => {
  try {
    return res.json({ success: true, message: "User route working" });
  } catch (err) {
    console.error("me error:", err);
    return res.json({ success: false, message: "Failed" });
  }
};

export { loginWithPhone, me };
