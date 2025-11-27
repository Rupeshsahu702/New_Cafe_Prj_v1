// backend/middleware/auth.js
import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  // Accept either "token" header or "Authorization: Bearer <jwt>"
  let raw = req.headers.token;
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!raw && typeof auth === "string" && auth.startsWith("Bearer ")) {
    raw = auth.slice("Bearer ".length).trim();
  }

  if (!raw) {
    return res.status(401).json({ success: false, message: "Not Authorized Login Again" });
  }

  try {
    const token_decode = jwt.verify(raw, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    // Tell the client clearly; still 401 so UI can react
    return res.status(401).json({ success: false, message: error.message || "Unauthorized" });
  }
};

export default authMiddleware;
