// frontend/components/ThemeToggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita erro de hidratação garantindo que o componente só renderize no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
}