// backend/controllers/smsController.js
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { sendOtpSms } from "../services/smsProvider.js";
import { generateNumericOtp, hashOtp, verifyOtpHash } from "../utils/otp.js";

const OTP_TTL = parseInt(process.env.OTP_TTL_SECONDS || "300", 10);          // expiry stays 5 min unless you change env
const RESEND_COOLDOWN = parseInt(process.env.OTP_RESEND_SECONDS || "30", 10); // now 60 via .env
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

// POST /api/sms/request  { phoneNumber }
export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      return res.json({ success: false, message: "Phone must be E.164 like +91XXXXXXXXXX" });
    }

    let user = await userModel.findOne({ phoneNumber }).select("+otpLastSentAt");
    if (!user) user = await userModel.create({ phoneNumber });

    const now = new Date();
    if (user.otpLastSentAt && now - user.otpLastSentAt < RESEND_COOLDOWN * 1000) {
      const remaining = Math.ceil((RESEND_COOLDOWN * 1000 - (now - user.otpLastSentAt)) / 1000);
      return res.json({ success: false, message: `Wait ${remaining}s before resending`, remaining });
    }

    // generate numeric OTP and store hash + expiry
    const otp = generateNumericOtp(); // 6 digits by default
    const otpHash = await hashOtp(otp);
    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL * 1000);
    user.otpAttemptCount = 0;
    user.otpLastSentAt = now;
    user.otpSessionId = undefined; // ignore old session-style flow
    await user.save();

    // send ONLY the digits to 2Factor's OTP endpoint
    const sent = await sendOtpSms(phoneNumber, otp);
    if (!sent) return res.json({ success: false, message: "Failed to send OTP" });

    return res.json({ success: true, message: "OTP sent via SMS", cooldownSeconds: RESEND_COOLDOWN });
  } catch (err) {
    console.error("requestOtp error:", err);
    return res.json({ success: false, message: "Server error requesting OTP" });
  }
};

// POST /api/sms/verify  { phoneNumber, otp }
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.json({ success: false, message: "Phone and OTP required" });
    }

    const user = await userModel
      .findOne({ phoneNumber })
      .select("+otpHash +otpExpiresAt +otpAttemptCount");

    if (!user || !user.otpHash || !user.otpExpiresAt) {
      return res.json({ success: false, message: "Request a new OTP" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.json({ success: false, message: "OTP expired" });
    }

    if (user.otpAttemptCount >= MAX_ATTEMPTS) {
      return res.json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    const ok = await verifyOtpHash(otp, user.otpHash);
    user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;

    if (!ok) {
      await user.save();
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // success: clear OTP state
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttemptCount = 0;
    await user.save();

    const token = signToken(user._id);
    return res.json({ success: true, token });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.json({ success: false, message: "Server error verifying OTP" });
  }
};
