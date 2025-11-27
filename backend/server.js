import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import smsRouter from "./routes/smsRoute.js";

// NEW: analytics + dev seed routes
import analyticsRouter from "./routes/analyticsRoute.js";


// app config
const app = express();
const port = process.env.PORT || 4000;

// Sanity check: JWT must exist
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error("FATAL: JWT_SECRET is missing or too short. Set it in backend/.env");
  process.exit(1);
}

// ----- CORS -----
/**
 * Allow both user app (5173) and admin app (5174).
 * You can override with FRONTEND_URLS="http://a:5173,http://b:5174"
 */
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
const envOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, cb) {
      // Allow tools without an Origin (curl, Postman) and same-origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "token", "authorization"],
    credentials: true,
  })
);
// Handle preflight quickly
app.options("*", cors());

// body parser
app.use(express.json());

// db connection
connectDB();

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/sms", smsRouter);

// NEW: analytics endpoints (charts on admin panel call these)
app.use("/api/analytics", analyticsRouter);

// root
app.get("/", (_req, res) => {
  res.send("API Working");
});

// bind on all interfaces so the host browser can reach us even in WSL/Docker
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Server started on http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
  console.log("CORS allowed origins:", allowedOrigins.join(", "));
});
