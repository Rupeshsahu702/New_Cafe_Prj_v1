import React, { useState } from "react";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import Slideshow from "../../components/Slideshow/Slideshow"; // new section

const Home = () => {
  // "All" means show the full menu; categories set this to their name
  const [category, setCategory] = useState("All");

  // Called by the Header's "View Menu" button
  const handleViewMenu = () => {
    // Reset filter to show everything
    setCategory("All");
    // Scroll to the categories/menu section for a nicer UX
    const el = document.getElementById("explore-menu");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Header onViewMenu={handleViewMenu} />
      {/* ExploreMenu toggles categories; no "All" chip here */}
      <ExploreMenu setCategory={setCategory} category={category} />
      {/* FoodDisplay shows either all or filtered by category */}
      <FoodDisplay category={category} />
      {/* New infinite all-CSS slideshow lives where the old app-download section was */}
      <Slideshow />
    </>
  );
};

export default Home;
