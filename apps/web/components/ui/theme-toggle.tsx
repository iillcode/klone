'use client';

import { useTheme } from '@/components/ui/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 group"
    >
      <div className="relative w-10 h-5 rounded-full bg-border transition-colors duration-300 group-hover:bg-border/80">
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-primary shadow-md transition-transform duration-300 ease-in-out ${
            theme === 'light' ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-4 h-4">
          {/* Sun icon */}
          <svg
            className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
              theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {/* Moon icon */}
          <svg
            className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
        <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
      </div>
    </button>
  );
}
