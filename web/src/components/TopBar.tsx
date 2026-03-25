import { motion } from "framer-motion";

type TopBarProps = {
  viewMode: "list" | "board" | "calendar";
  onViewMode: (mode: "list" | "board" | "calendar") => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSearchOpen: () => void;
  onMenuOpen: () => void;
};

export function TopBar({
  viewMode,
  onViewMode,
  isDark,
  onToggleTheme,
  onSearchOpen,
  onMenuOpen,
}: TopBarProps) {
  return (
    <motion.header
      layout
      className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-surface-border bg-white/90 px-3 py-3 backdrop-blur-md dark:bg-surface-raised/60 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 md:hidden"
          aria-label="Open menu"
          onClick={onMenuOpen}
        >
          <MenuIcon />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            TodoFlow
          </p>
          <p className="hidden text-xs text-zinc-500 dark:text-zinc-500 sm:block">
            Tasks &amp; projects
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div
          className="inline-flex rounded-xl border border-surface-border bg-zinc-100/90 p-1 dark:bg-black/40"
          role="tablist"
          aria-label="View mode"
        >
          {(["list", "board", "calendar"] as const).map((mode) => (
            <motion.button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              onClick={() => onViewMode(mode)}
              layout
              className={`relative rounded-lg px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm ${
                viewMode === mode
                  ? "text-violet-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {viewMode === mode && (
                <motion.span
                  layoutId="viewTab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-violet-500/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 capitalize">
                {mode === "calendar" ? "Calendar" : mode}
              </span>
            </motion.button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSearchOpen}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-surface-border px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
          aria-label="Open search"
        >
          <SearchIcon />
          <span className="hidden sm:inline">Search</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </motion.header>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
