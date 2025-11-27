import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },

    // New dine-in customer info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    tableNumber: { type: Number, required: true, min: 1, max: 7 },

    // Cart snapshot
    items: { type: [orderItemSchema], required: true },

    // Money
    amount: { type: Number, required: true, min: 0 },

    // Status for admin panel
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
