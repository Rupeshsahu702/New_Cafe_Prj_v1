import React, { useEffect, useRef, useState } from "react";
import "./LoginModal.css";
import { verifyCredentials } from "../../auth/auth";
import { useAuth } from "../../auth/AuthContext";

export default function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const idRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErr("");
      setId("");
      setPw("");
      setShowPw(false);
      setTimeout(() => idRef.current?.focus(), 50);
    }
  }, [open]);

  const doLogin = () => {
    const u = verifyCredentials(id.trim(), pw);
    if (!u) {
      setErr("Invalid ID or password");
      return;
    }
    login(u);
    onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") doLogin();
    if (e.key === "Escape") onClose?.();
  };

  if (!open) return null;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-card" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="login-head">
          <div className="login-title">Sign in</div>
          <button className="login-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="login-body">
          <label className="login-label" htmlFor="login_user">User ID</label>
          <input
            id="login_user"
            ref={idRef}
            className="login-input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="admin or developer"
            autoComplete="username"
          />

          <label className="login-label" htmlFor="login_pw">Password</label>

          <div className="pw-wrap">
            <input
              id="login_pw"
              className="login-input pw-input"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {/* Show/Hide button — click toggles, press-and-hold peeks */}
            <button
              type="button"
              className="pw-toggle"
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              onMouseDown={() => setShowPw(true)}
              onMouseUp={() => setShowPw(false)}
              onMouseLeave={() => setShowPw(false)}
              onTouchStart={() => setShowPw(true)}
              onTouchEnd={() => setShowPw(false)}
              onClick={() => setShowPw((v) => !v)}
              title="Show password (hold to peek)"
            >
              {/* eye icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {showPw ? (
                  <>
                    <path d="M3 3l18 18" stroke="#6b7280" strokeWidth="2" />
                    <path d="M10.585 7.414A5 5 0 0117 12c0 .87-.22 1.69-.606 2.405M7.5 9.5C6.57 10.37 5.77 11.39 5 12c2.5 2 4.5 3 7 3 .79 0 1.55-.1 2.28-.29" stroke="#6b7280" strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#6b7280" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="#6b7280" strokeWidth="2" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {err ? <div className="login-error">{err}</div> : null}

          <button className="login-btn" onClick={doLogin}>
            Login
          </button>
        </div>

        <div className="login-foot">
          <div className="hint">Roles allowed: Admin, Developer</div>
        </div>
      </div>
    </div>
  );
}
