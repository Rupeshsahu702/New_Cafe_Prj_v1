// Simple in-memory credentials. Change these before going live.
export const USERS = {
  admin: {
    id: "admin",            // <<< change me
    password: "Admin@6262111109",  // <<< change me
    role: "admin",
    display: "Admin",
  },
  developer: {
    id: "developer",         // <<< change me
    password: "Dev@7470669907",     // <<< change me
    role: "developer",
    display: "Developer",
  },
};

export function verifyCredentials(inputId, inputPassword) {
  const u = Object.values(USERS).find(
    user => String(user.id).toLowerCase() === String(inputId || "").toLowerCase()
  );
  if (!u) return null;
  return u.password === inputPassword ? { id: u.id, role: u.role, display: u.display } : null;
}
