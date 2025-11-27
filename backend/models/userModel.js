// backend/models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    phoneNumber: { type: String, required: true, unique: true },

    // Local OTP flow fields
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttemptCount: { type: Number, default: 0, select: false },
    otpLastSentAt: { type: Date, select: false },

    // leftover from experiments; not used in local flow
    otpSessionId: { type: String, select: false },

    cartData: { type: Object, default: {} }
  },
  { minimize: false, timestamps: true }
);

// Ensure phoneNumber has a unique index
userSchema.index({ phoneNumber: 1 }, { unique: true });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
