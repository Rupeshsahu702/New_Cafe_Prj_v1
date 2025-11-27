import React from "react";
import "./Navbar.css";
import { useAuth } from "../../auth/AuthContext";

const Navbar = ({ onHamburgerClick, onAvatarClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="nav-left">
        <button className="hamburger" onClick={onHamburgerClick} aria-label="Menu">
          ☰
        </button>
        <div className="brand">
          <span className="brand-name">MMC-Bhilai</span>
          <span className="brand-sub">Admin Panel</span>
        </div>
      </div>

      <div className="nav-right">
        {/* avatar + caption */}
        <div className="avatar-wrap" onClick={onAvatarClick} role="button" tabIndex={0}
             onKeyDown={(e)=>{ if(e.key==='Enter'){ onAvatarClick?.(); }}}>
          <img
            className="avatar"
            src="https://i.pravatar.cc/48?img=12"
            alt="Account"
          />
          <div className="avatar-caption">
            {user ? user.display : "Login"}
          </div>
        </div>

        {user ? (
          <button className="logout-btn" onClick={logout} title="Sign out">
            Logout
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Navbar;
