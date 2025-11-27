import express from "express";
import { listFood, addFood, removeFood } from "../controllers/foodController.js";
import adminOnly from "../middleware/admin.js";

const foodRouter = express.Router();

// No multer, no file upload. Pure JSON bodies.
foodRouter.get("/list", listFood);
foodRouter.post("/add", adminOnly, addFood);
foodRouter.post("/remove", adminOnly, removeFood);

export default foodRouter;
