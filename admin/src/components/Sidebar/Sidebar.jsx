import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

/*
  Desktop: this renders as a normal static sidebar.
  Mobile:  becomes a slide-in drawer. isOpen/onClose control it.
*/
const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const handleNav = () => onClose()

  return (
    <>
      {/* overlay only on mobile via CSS */}
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <div className="sidebar-options">
          <NavLink to='/add' className="sidebar-option" onClick={handleNav}>
            <img src={assets.add_icon} alt="" />
            <p>Add Items</p>
          </NavLink>

          <NavLink to='/list' className="sidebar-option" onClick={handleNav}>
            <img src={assets.order_icon} alt="" />
            <p>List Items</p>
          </NavLink>

          <NavLink to='/orders' className="sidebar-option" onClick={handleNav}>
            <img src={assets.order_icon} alt="" />
            <p>Orders</p>
          </NavLink>

          <NavLink to='/analytics' className="sidebar-option" onClick={handleNav}>
            <img src={assets.order_icon} alt="" />
            <p>Analytics</p>
          </NavLink>
        </div>
      </div>
    </>
  )
}

export default Sidebar
