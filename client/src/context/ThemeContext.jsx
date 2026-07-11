import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeCtx = createContext(null);
const LS_KEY = "hpc_theme"; // 'light' | 'dark' | 'system'

function systemDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function apply(mode) {
  const dark = mode === "dark" || (mode === "system" && systemDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

export function ThemeProvider({ children }) {
  // HPCons: giao diện TỐI là mặc định
  const [mode, setMode] = useState(() => localStorage.getItem(LS_KEY) || "dark");
  const [isDark, setIsDark] = useState(() => apply(localStorage.getItem(LS_KEY) || "dark"));

  useEffect(() => {
    localStorage.setItem(LS_KEY, mode);
    setIsDark(apply(mode));
  }, [mode]);

  // Theo dõi thay đổi của hệ thống khi đang ở chế độ "system"
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setIsDark(apply("system"));
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  // Xoay vòng: sáng → tối → theo hệ thống → sáng...
  const cycle = useCallback(() => {
    setMode((m) => (m === "light" ? "dark" : m === "dark" ? "system" : "light"));
  }, []);

  return (
    <ThemeCtx.Provider value={{ mode, isDark, setMode, cycle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme phải nằm trong <ThemeProvider>");
  return ctx;
}
