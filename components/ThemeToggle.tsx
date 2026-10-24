"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/icons";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("aqel-theme", next ? "dark" : "light");
    } catch {
      /* تجاهل */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost h-9 w-9 p-0"
      aria-label={dark ? "تفعيل الموضوع المضيء" : "تفعيل الموضوع المظلم"}
      title={dark ? "موضوع مضيء" : "موضوع مظلم"}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
