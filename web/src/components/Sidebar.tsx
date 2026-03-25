import { AnimatePresence, motion } from "framer-motion";
import type { NavMode, Project, SmartListFilter } from "../types";

type SidebarProps = {
  projects: Project[];
  nav: NavMode;
  onSelectProject: (id: string) => void;
  onSelectSmart: (filter: SmartListFilter) => void;
  onNewProject: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

const SMART_ITEMS: { key: SmartListFilter; label: string; hint: string }[] = [
  { key: "today", label: "Today", hint: "Due today" },
  { key: "upcoming", label: "Upcoming", hint: "Future due dates" },
  { key: "overdue", label: "Overdue", hint: "Past due, open" },
  { key: "completed", label: "Completed", hint: "Done tasks" },
];

export function Sidebar({
  projects,
  nav,
  onSelectProject,
  onSelectSmart,
  onNewProject,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const smartActive = nav.kind === "smart" ? nav.filter : null;
  const projectActive = nav.kind === "project" ? nav.projectId : null;

  const panel = (
    <div className="flex h-full flex-col border-surface-border bg-white/95 backdrop-blur-md dark:bg-surface-raised/95 md:border-r">
      <div className="flex items-center justify-between px-4 pb-2 pt-4 md:pt-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Navigate</span>
        <button
          type="button"
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 md:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        >
          <CloseIcon />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Smart lists and projects">
        <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Smart lists
        </p>
        <ul className="space-y-0.5">
          {SMART_ITEMS.map((item) => {
            const active = smartActive === item.key;
            return (
              <li key={item.key}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelectSmart(item.key);
                    onMobileClose();
                  }}
                  className={`flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors ${
                    active
                      ? "bg-violet-500/15 text-violet-800 dark:text-violet-100"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">{item.hint}</span>
                </motion.button>
              </li>
            );
          })}
        </ul>

        <p className="mb-1 mt-6 px-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Projects
        </p>
        <ul className="space-y-0.5">
          {projects.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500">No projects yet</li>
          ) : (
            projects.map((p) => {
              const active = projectActive === p.id;
              return (
                <li key={p.id}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectProject(p.id);
                      onMobileClose();
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-violet-500/15 text-violet-800 dark:text-violet-100"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-zinc-400">{p.task_count}</span>
                  </motion.button>
                </li>
              );
            })
          )}
        </ul>
      </nav>

      <div className="border-t border-surface-border p-3 dark:border-surface-border">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onNewProject();
            onMobileClose();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border py-2.5 text-sm font-medium text-zinc-600 hover:border-violet-400 hover:text-violet-700 dark:text-zinc-400 dark:hover:border-violet-400/50 dark:hover:text-violet-200"
        >
          <PlusIcon />
          New project
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(18rem,88vw)] max-w-[18rem] flex-col shadow-lg shadow-black/20 transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {panel}
      </aside>
    </>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
