// backend/routes/orderRoute.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import {
  listOrders,
  // placeOrder,
  updateStatus,
  userOrders,
  verifyOrder,
  placeOrderCod,
  getOrderById,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Admin: list all orders
orderRouter.get("/list", adminOnly, listOrders);

// Admin: get single order by id (for printing)
orderRouter.get("/:id", adminOnly, getOrderById);

// User: list own orders
orderRouter.post("/userorders", authMiddleware, userOrders);

// Stripe path (kept for future): creates order, returns session URL
// orderRouter.post("/place", authMiddleware, placeOrder);

// Update order status (admin panel)
orderRouter.post("/status", adminOnly, updateStatus);

// Stripe webhook-style verification endpoint used by frontend verify step
orderRouter.post("/verify", verifyOrder);

// Pay on Counter (POC): immediate order creation
orderRouter.post("/placecod", authMiddleware, placeOrderCod);

export default orderRouter;
