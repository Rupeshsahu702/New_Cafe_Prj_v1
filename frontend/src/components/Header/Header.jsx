import React from "react";
import "./Header.css";

/**
 * Header with a "View Menu" button.
 * We don't navigate anywhere. We simply call onViewMenu()
 * that the Home page passes in, which resets the filter to "All"
 * and scrolls down to the menu section.
 */
const Header = ({ onViewMenu }) => {
  const handleClick = () => {
    if (typeof onViewMenu === "function") onViewMenu();
  };

  return (
    <div className="header">
      <div className="header-contents">
        <h2>Order your favourite food here</h2>
        <p>
          Choose from a diverse menu featuring a delectable array of dishes crafted
          with the finest ingredients and culinary expertise. Our mission is to
          satisfy your cravings and elevate your dining experience.
        </p>
        <button onClick={handleClick}>View Menu</button>
      </div>
    </div>
  );
};

export default Header;
