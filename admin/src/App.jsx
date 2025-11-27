import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes, Navigate } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Analytics from "./pages/Analytics/Analytics";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginModal from "./components/LoginModal/LoginModal";

function ProtectedShell() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Drive the modal off auth state: open when logged out, close when logged in.
  useEffect(() => {
    setLoginOpen(!user);
  }, [user]);

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  return (
    <>
      <ToastContainer />
      <Navbar onHamburgerClick={() => setSidebarOpen((s) => !s)} onAvatarClick={openLogin} />
      <hr />
      <div className="app-content">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {user ? (
          <Routes>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/add" element={<Add />} />
            <Route path="/list" element={<List />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/analytics" replace />} />
          </Routes>
        ) : (
          <div style={{ padding: 24, width: "100%" }}>
            <div
              style={{
                maxWidth: 720,
                margin: "40px auto",
                padding: 24,
                border: "1px dashed #f2c9bf",
                borderRadius: 16,
                background: "#fffdfa",
                textAlign: "center",
              }}
            >
              <h2 style={{ marginBottom: 6 }}>Sign in required</h2>
              <p style={{ color: "#6b7280", marginBottom: 14 }}>
                Click the profile icon at the top-right to log in as <b>Admin</b> or <b>Developer</b>.
              </p>
              <button
                className="logout-btn"
                onClick={openLogin}
                style={{ padding: "10px 16px", fontWeight: 700 }}
              >
                Open login
              </button>
            </div>
          </div>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={closeLogin} />
    </>
  );
}

export default function App() {
  return (
    <div className="app">
      <AuthProvider>
        <ProtectedShell />
      </AuthProvider>
    </div>
  );
}
