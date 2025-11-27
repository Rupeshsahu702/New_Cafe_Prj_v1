// backend/controllers/foodController.js
import foodModel from "../models/foodModel.js";

export const addFood = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || !description || price === undefined || !category) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const food = new foodModel({
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      category: String(category).trim()
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Add failed" });
  }
};

export const listFood = async (_req, res) => {
  try {
    const foods = await foodModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "List failed" });
  }
};

export const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "Missing id" });
    const found = await foodModel.findById(id);
    if (!found) return res.json({ success: false, message: "Not found" });

    await foodModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Remove failed" });
  }
};
