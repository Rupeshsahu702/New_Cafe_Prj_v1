// backend/utils/otp.js
import crypto from "crypto";
import bcrypt from "bcrypt";

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || "6", 10);

export function generateNumericOtp() {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

export async function verifyOtpHash(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}
