"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 cursor-pointer"
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
      aria-label="Toggle visual theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5 text-amber-500" />
      )}
    </button>
  );
}

export default ThemeToggle;
