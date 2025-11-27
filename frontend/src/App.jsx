import React, { useContext } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import Cart from './pages/Cart/Cart';
import LoginPopup from './components/LoginPopup/LoginPopup';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import MyOrders from './pages/MyOrders/MyOrders';
import Verify from './pages/Verify/Verify';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StoreContext } from './Context/StoreContext';

const App = () => {
  const { token, isAuthReady } = useContext(StoreContext);
  const location = useLocation();

  // Show a loading spinner until the context has checked for a token
  if (!isAuthReady) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontSize: '18px', fontWeight: '500' }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      {/* If auth is ready and there is NO token, show the forced login modal.
        This modal will now render ON TOP of the app content below.
      */}
      {!token && isAuthReady && <LoginPopup setShowLogin={() => {}} forceLogin={true} />}

      {/* Always render the main app structure, regardless of login state.
        The modal above will overlay this content if the user is not logged in.
      */}
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/verify" element={<Verify />} />
          {/* Add a fallback route to redirect to home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {location.pathname !== '/verify' && <Footer />}
    </>
  );
};

export default App;