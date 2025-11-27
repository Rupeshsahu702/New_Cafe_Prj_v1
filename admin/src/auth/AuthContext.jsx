import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from localStorage synchronously so first render knows if you're logged in.
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("mm_auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (userObj) => {
    setUser(userObj);
    try { localStorage.setItem("mm_auth_user", JSON.stringify(userObj)); } catch {}
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem("mm_auth_user"); } catch {}
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
