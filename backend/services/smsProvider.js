// backend/services/smsProvider.js
import axios from "axios";

const API_KEY = process.env.SMS_API_KEY;
const BASE_URL = "https://2factor.in/API/V1";

// 2Factor expects digits-only phone (no '+')
function toDigits(phoneE164) {
  return String(phoneE164).replace(/^\+/, "");
}

/**
 * Send OTP using 2Factor's OTP SMS endpoint:
 * GET /API/V1/<API_KEY>/SMS/<PHONE>/<OTP>
 * This uses their default SMS template on their side.
 */
export async function sendOtpSms(phoneE164, otp) {
  const phone = toDigits(phoneE164);
  if (!/^\d{4,6}$/.test(String(otp))) {
    throw new Error("OTP must be 4–6 digits for 2Factor OTP endpoint");
  }

  const url = `${BASE_URL}/${API_KEY}/SMS/${phone}/${otp}`;
  try {
    const res = await axios.get(url);
    if (res.data?.Status === "Success") return true;

    console.error("2Factor send error:", res.data);
    return false;
  } catch (err) {
    console.error("2Factor send error:", err.response?.data || err.message);
    return false;
  }
}
