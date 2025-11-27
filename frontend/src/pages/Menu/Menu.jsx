import React, { useEffect, useState } from "react";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import Header from "../../components/Header/Header";
import { useLocation } from "react-router-dom";

/**
 * Page wrapper. Reads ?category from URL.
 * - ?category=All or no param => show entire menu (category = "")
 * - otherwise filter by that category string
 */
const Menu = () => {
  const location = useLocation();
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("category");
    const normalized = (raw || "").toLowerCase();
    setCategory(normalized === "all" || !raw ? "" : raw);
  }, [location.search]);

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
    </div>
  );
};

export default Menu;
