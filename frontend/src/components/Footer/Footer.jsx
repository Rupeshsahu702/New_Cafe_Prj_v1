import React from 'react';
import './Footer.css';
import { assets } from '../../assets/assets';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        {/* Left Section */}
        <div className="footer-content-left">
          <img src={assets.logo} alt="Momo Magic Cafe" className="footer-logo" />
          <p>
            At Momo Magic Cafe, we serve joy wrapped in every momo. A cozy space to relax,
            eat, and enjoy authentic flavors — where every visit feels like home.
          </p>

          <div className="footer-social-icons">
            <a
              href="https://www.facebook.com/share/1BrZRWpBh4/?mibextid=wwXIfr"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="social-link"
            >
              <i className="fa-brands fa-facebook"></i>
            </a>

            <a
              href="https://www.instagram.com/momomagiccafe.bhilai?igsh=MW1hdjFhNW01eTZs"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="social-link"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>

            <a
              href="https://www.google.com/maps?rlz=1C1OPNX_enIN1096IN1096&um=1&ie=UTF-8&fb=1&gl=in&sa=X&geocode=KcVgdORXPSk6MR1yOyZtRGD_&daddr=block+no+5,+Nehru+Nagar+Main+Rd,+next+to+ek+saath+cafe,+Vidya+Vihar+Colony,+Bhilai,+Chhattisgarh+490020"
              target="_blank"
              rel="noreferrer"
              aria-label="Location"
              className="social-link"
            >
              <i className="fa-solid fa-map-location-dot"></i>
            </a>
          </div>
        </div>

        {/* Middle Section */}
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul className="company-list">
            <li onClick={handleHomeClick}>
              <i className="fa-solid fa-house footer-icon"></i>
              <span>Home</span>
            </li>
            <li>
              <Link to="/about">
                <i className="fa-regular fa-address-card footer-icon"></i>
                <span>About us</span>
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy">
                <i className="fa-solid fa-lock footer-icon"></i>
                <span>Privacy policy</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul className="contact-list">
            <li className="contact-item">
              <i className="fa-solid fa-phone contact-icon" aria-hidden="true"></i>
              <a href="tel:+916262111109">+91-6262111109</a>
            </li>
            <li className="contact-item">
              <i className="fa-solid fa-envelope contact-icon" aria-hidden="true"></i>
              <a href="mailto:Khomesh1008sahu@gmail.com">Khomesh1008sahu@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>

      <hr />
      <p className="footer-copyright">
        Copyright 2024 © Momo Magic Cafe Bhilai - All Right Reserved.
      </p>
      <p className="footer-copyright">
        (Designed and Developed by Team Code2dbug)
      </p>
    </div>
  );
};

export default Footer;
