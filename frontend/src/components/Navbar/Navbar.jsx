import React, { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StoreContext } from "../../Context/StoreContext";

const Navbar = () => {
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Single source of truth for active underline
  const [menu, setMenu] = useState("home");

  // Keep underline exclusive: sync with route only
  // when user is not explicitly on "menu" or "contact"
  useEffect(() => {
    if (menu === "menu" || menu === "contact") return; // respect explicit picks
    if (location.pathname === "/myorders") setMenu("orders");
    else setMenu("home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
    setMenu("home");
  };

  const goToOrders = () => {
    if (token) {
      navigate("/myorders");
      setMenu("orders");
    } else {
      // No token, but login is forced, so this button
      // will only be shown when logged in anyway.
      // No action needed if no token.
    }
  };

  const handleMenuClick = () => {
    setMenu("menu");
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("explore-menu");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } else {
      const el = document.getElementById("explore-menu");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Exclusive active check: only the selected "menu" state is active
  const isActive = (name) => menu === name;

  const cartHasItems = getTotalCartAmount() > 0;

  return (
    <div className="navbar">
      <Link
        to="/"
        onClick={() => {
          navigate("/");
          setMenu("home");
        }}
      >
        <img className="logo" src={assets.logo} alt="Tomato" />
      </Link>

      <ul className="navbar-menu">
        <button
          type="button"
          onClick={() => {
            navigate("/");
            setMenu("home");
          }}
          className={`linklike ${isActive("home") ? "active" : ""}`}
        >
          Home
        </button>

        <button
          type="button"
          onClick={handleMenuClick}
          className={`linklike ${isActive("menu") ? "active" : ""}`}
        >
          Menu
        </button>

        <button
          type="button"
          onClick={goToOrders}
          className={`linklike ${isActive("orders") ? "active" : ""}`}
        >
          Orders
        </button>

        <a
          href="#footer"
          onClick={() => setMenu("contact")}
          className={`linklike ${isActive("contact") ? "active" : ""}`}
        >
          Contact Us
        </a>
      </ul>

      <div className="navbar-right">
        <Link to="/cart" className="navbar-cart" aria-label="Cart">
          <div className="navbar-icon-container">
            <img src={assets.basket_icon} alt="" />
            {cartHasItems && <div className="dot" aria-hidden="true"></div>}
          </div>
          <span>Cart</span>
        </Link>

        {!token ? (
          <></> // "Sign In" button removed
        ) : (
          <div className="navbar-profile-container">
            <div className="navbar-icon-container">
              <img src={assets.profile_icon} alt="Profile" />
            </div>
            <span>Profile</span>
            <ul className="navbar-profile-dropdown">
              <li
                onClick={() => {
                  navigate("/myorders");
                  setMenu("orders");
                }}
              >
                <img src={assets.bag_icon} alt="" /> <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" /> <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;