"use client";

import React from "react";
import { useTheme } from "../app/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center ${
        theme === "dark"
          ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 shadow-sm"
      } ${className}`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
