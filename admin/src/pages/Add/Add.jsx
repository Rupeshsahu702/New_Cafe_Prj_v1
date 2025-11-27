// admin/src/pages/Add/Add.jsx
import React, { useState } from "react";
import "./Add.css";
import { url } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
// const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;


const CATEGORIES = [
  "Sizzlers",
  "Coffee",
  "Maggi",
  "Dessert",
  "Beverages",
  "Chinese Magic",
  "Soup",
  "Pasta",
  "Moburg",
  "MMC Special Dishes",
  "Chinese Magic Noodles",
  "Chinese Magic Rice",
  "Momos • Special Magic (8 pcs)",
  "Momos • Steam & Fried",
  "Momos • Tandoori (8 pcs)",
];

const Add = () => {
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: CATEGORIES[0],
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: Number(data.price),
        category: data.category,
      };

      if (!payload.name || !payload.description || isNaN(payload.price)) {
        toast.error("Please fill all fields correctly.");
        return;
      }

      const response = await axios.post(`${url}/api/food/add`, payload, {
        headers: {
          // "x-admin-key": ADMIN_KEY,
          "Content-Type": "application/json"
        }
      });

      if (response.data?.success) {
        toast.success(response.data.message || "Item added");
        setData({
          name: "",
          description: "",
          price: "",
          category: CATEGORIES[0],
        });
      } else {
        toast.error(response.data?.message || "Failed to add item");
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed");
    }
  };

  return (
    <div className="add">
      <h2 className="add-title">Add a new product</h2>

      <div className="add-card">
        {/* two-column on wide screens, single column on small via CSS */}
        <form className="add-grid" onSubmit={onSubmitHandler}>
          {/* LEFT COLUMN */}
          <div className="flex-col">
            {/* Product Name */}
            <div className="add-field">
              <label htmlFor="name" className="label">
                Product name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Type here"
                value={data.name}
                onChange={onChangeHandler}
                required
              />
            </div>

            {/* Description */}
            <div className="add-field">
              <label htmlFor="description" className="label">
                Product description
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                placeholder="Write content here"
                value={data.description}
                onChange={onChangeHandler}
                required
              />
            </div>

            {/* Category + Price row */}
            <div className="add-row">
              <div className="add-field">
                <label htmlFor="category" className="label">
                  Product category
                </label>
                <select
                  id="category"
                  name="category"
                  value={data.category}
                  onChange={onChangeHandler}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="add-field">
                <label htmlFor="price" className="label">
                  Product Price
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="100"
                  value={data.price}
                  onChange={onChangeHandler}
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="add-actions">
              <button type="submit" className="add-btn">
                ADD
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN (Optional aside/help panel) */}
          <div className="flex-col">
            <div className="add-aside">
              <strong style={{ display: "block", marginBottom: 6 }}>
                Tips
              </strong>
              <ul style={{ marginLeft: 16, lineHeight: 1.5 }}>
                <li>Keep names short and clear.</li>
                <li>Use friendly descriptions customers understand.</li>
                <li>Prices are whole numbers (₹).</li>
              </ul>
            </div>

            {/* If you add image upload later, you already have a spot */}
            <div className="add-preview">Image preview (optional)</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Add;
