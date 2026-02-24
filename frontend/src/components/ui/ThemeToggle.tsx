'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-(--surface-hover) transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <HiOutlineSun className="w-4 h-4 text-(--text-secondary)" />
      ) : (
        <HiOutlineMoon className="w-4 h-4 text-(--text-secondary)" />
      )}
    </button>
  );
}
