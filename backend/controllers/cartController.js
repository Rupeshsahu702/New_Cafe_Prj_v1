import mongoose from "mongoose";
import userModel from "../models/userModel.js";

/* ---------- helpers ---------- */
const isMongoId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

/**
 * Ensure we have a valid user document to operate on.
 * If userId is missing/invalid or the user doesn't exist, create a lightweight guest.
 * Returns the user doc (with cartData {}) and its _id.
 */
async function ensureUser(userId, seed = {}) {
  try {
    if (isMongoId(userId)) {
      const existing = await userModel.findById(userId);
      if (existing) return existing;
    }
    // create guest
    const guest = await userModel.create({
      firstName: String(seed.firstName || "Guest"),
      lastName: String(seed.lastName || ""),
      email: String(seed.email || "").trim(),
      cartData: {},
      role: "guest"
    });
    return guest;
  } catch (e) {
    // as a last resort, create an empty guest
    const guest = await userModel.create({ firstName: "Guest", cartData: {}, role: "guest" });
    return guest;
  }
}

/* ---------- controllers ---------- */

// add to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, firstName, lastName, email } = req.body;
    const user = await ensureUser(userId, { firstName, lastName, email });

    const cartData = user?.cartData || {};
    const id = String(itemId);

    cartData[id] = (Number(cartData[id]) || 0) + 1;

    const updated = await userModel.findByIdAndUpdate(
      user._id,
      { cartData },
      { new: true }
    );

    res.json({
      success: true,
      message: "Added To Cart",
      userId: String(updated._id),
      cartData: updated.cartData || {}
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// remove food from user cart
const removeFromCart = async (req, res) => {
  try {
    const { userId, itemId, firstName, lastName, email } = req.body;
    const user = await ensureUser(userId, { firstName, lastName, email });

    const cartData = user?.cartData || {};
    const id = String(itemId);

    if (Number(cartData[id]) > 0) {
      cartData[id] = Number(cartData[id]) - 1;
      if (cartData[id] <= 0) delete cartData[id];
    }

    const updated = await userModel.findByIdAndUpdate(
      user._id,
      { cartData },
      { new: true }
    );

    res.json({
      success: true,
      message: "Removed From Cart",
      userId: String(updated._id),
      cartData: updated.cartData || {}
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// get user cart
const getCart = async (req, res) => {
  try {
    const { userId, firstName, lastName, email } = req.body;
    const user = await ensureUser(userId, { firstName, lastName, email });

    res.json({
      success: true,
      userId: String(user._id),
      cartData: user?.cartData || {}
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

/**
 * Merge a client-provided cart map into the user's server cart.
 * Body: { userId, cart: { [itemId:string]: number } }
 * Returns: { success, cartData, userId }
 */
const mergeCart = async (req, res) => {
  try {
    const { userId, firstName, lastName, email } = req.body;
    const incoming = req.body.cart || {};
    const user = await ensureUser(userId, { firstName, lastName, email });

    const current = user?.cartData || {};
    const merged = { ...current };

    for (const [rawId, rawQty] of Object.entries(incoming)) {
      const id = String(rawId);
      const qty = Math.max(0, Number(rawQty) || 0);
      if (qty > 0) merged[id] = (merged[id] || 0) + qty;
    }

    const updated = await userModel.findByIdAndUpdate(
      user._id,
      { cartData: merged },
      { new: true }
    );

    res.json({
      success: true,
      message: "Cart merged",
      userId: String(updated._id),
      cartData: updated.cartData || {}
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addToCart, removeFromCart, getCart, mergeCart };
