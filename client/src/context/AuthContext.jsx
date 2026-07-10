import { createContext, useContext, useEffect, useState } from "react";
import authApi from "../lib/auth";
import { canEdit, isAdmin, roleName } from "../lib/roles";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = authApi.onChange((u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  const value = {
    user,
    ready,
    async login(username, password) {
      const u = await authApi.login(username, password);
      setUser(u);
      return u;
    },
    async logout() {
      await authApi.logout();
      setUser(null);
    },
    // Tiện ích quyền hạn
    canEdit: canEdit(user?.role),
    isAdmin: isAdmin(user?.role),
    roleName: roleName(user?.role),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}
