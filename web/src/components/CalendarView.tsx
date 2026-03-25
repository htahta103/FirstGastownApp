import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Task } from "../types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const priorityAccent: Record<Task["priority"], string> = {
  urgent: "border-l-rose-500",
  high: "border-l-amber-500",
  medium: "border-l-sky-500",
  low: "border-l-zinc-500",
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday = 0 … Sunday = 6 */
function weekdayMondayFirst(d: Date): number {
  const sun = d.getDay();
  return sun === 0 ? 6 : sun - 1;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const n = weekdayMondayFirst(x);
  x.setDate(x.getDate() - n);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

function monthGridCells(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const lead = weekdayMondayFirst(first);
  const start = addDays(first, -lead);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

function tasksByDueDate(tasks: Task[]): Map<string, Task[]> {
  const m = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.due_date) continue;
    const list = m.get(t.due_date) ?? [];
    list.push(t);
    m.set(t.due_date, list);
  }
  for (const [, list] of m) {
    list.sort((a, b) => a.position - b.position);
  }
  return m;
}

export type CalendarGranularity = "month" | "week";

type CalendarViewProps = {
  tasks: Task[];
  selectedId: string | null;
  onSelectTask: (task: Task) => void;
};

export function CalendarView({ tasks, selectedId, onSelectTask }: CalendarViewProps) {
  const [granularity, setGranularity] = useState<CalendarGranularity>("month");
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  });

  const byDue = useMemo(() => tasksByDueDate(tasks), [tasks]);

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const weekDays = useMemo(() => {
    const start = startOfWeekMonday(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthCells = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return monthGridCells(y, m);
  }, [cursor]);

  const monthTitle = useMemo(() => {
    return cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [cursor]);

  const weekTitle = useMemo(() => {
    const a = weekDays[0];
    const b = weekDays[6];
    if (a.getFullYear() === b.getFullYear()) {
      if (a.getMonth() === b.getMonth()) {
        return `${a.toLocaleString(undefined, { month: "long" })} ${a.getDate()}–${b.getDate()}, ${a.getFullYear()}`;
      }
      return `${a.toLocaleString(undefined, { month: "short", day: "numeric" })} – ${b.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return `${a.toLocaleDateString()} – ${b.toLocaleDateString()}`;
  }, [weekDays]);

  function goToday() {
    const t = new Date();
    setCursor(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-surface-border bg-zinc-100/90 p-1 dark:bg-black/40"
          role="tablist"
          aria-label="Calendar range"
        >
          {(["month", "week"] as const).map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={granularity === g}
              onClick={() => setGranularity(g)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize sm:text-sm ${
                granularity === g
                  ? "bg-white text-violet-700 shadow-sm dark:bg-violet-500/20 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 sm:text-sm"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={granularity === "month" ? "Previous month" : "Previous week"}
              onClick={() => {
                if (granularity === "month") {
                  setCursor(addMonths(cursor, -1));
                } else {
                  setCursor(addDays(cursor, -7));
                }
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={granularity === "month" ? "Next month" : "Next week"}
              onClick={() => {
                if (granularity === "month") {
                  setCursor(addMonths(cursor, 1));
                } else {
                  setCursor(addDays(cursor, 7));
                }
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {granularity === "month" ? monthTitle : weekTitle}
      </h3>

      {granularity === "month" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-px rounded-xl border border-surface-border bg-surface-border dark:bg-surface-border">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="bg-zinc-100/90 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-surface-raised/80 dark:text-zinc-400"
              >
                {d}
              </div>
            ))}
            {monthCells.map(({ date, inMonth }) => {
              const iso = toISODate(date);
              const dayTasks = byDue.get(iso) ?? [];
              const isToday = iso === todayISO;
              return (
                <div
                  key={iso}
                  className={`flex min-h-[100px] flex-col gap-1 bg-white/90 p-1.5 dark:bg-surface-raised/40 sm:min-h-[120px] ${
                    inMonth ? "" : "opacity-40"
                  } ${isToday ? "ring-1 ring-inset ring-violet-500/50" : ""}`}
                >
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      isToday
                        ? "text-violet-600 dark:text-violet-300"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
                    {dayTasks.map((t) => (
                      <li key={t.id}>
                        <motion.button
                          type="button"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => onSelectTask(t)}
                          className={`w-full truncate rounded-md border border-l-2 border-surface-border bg-zinc-50/90 px-1.5 py-1 text-left text-[11px] font-medium leading-tight text-zinc-900 dark:bg-black/30 dark:text-zinc-100 ${
                            priorityAccent[t.priority]
                          } ${
                            selectedId === t.id
                              ? "ring-1 ring-violet-500/70"
                              : "hover:bg-zinc-100 dark:hover:bg-white/10"
                          } ${t.status === "done" ? "text-zinc-500 line-through opacity-80" : ""}`}
                        >
                          {t.title}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {weekDays.map((date) => {
            const iso = toISODate(date);
            const dayTasks = byDue.get(iso) ?? [];
            const isToday = iso === todayISO;
            return (
              <section
                key={iso}
                className={`flex min-h-[200px] flex-col rounded-xl border border-surface-border bg-white/50 p-2 dark:bg-surface-raised/30 ${
                  isToday ? "ring-1 ring-violet-500/40" : ""
                }`}
              >
                <header className="mb-2 border-b border-surface-border pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {date.toLocaleString(undefined, { weekday: "short" })}
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isToday
                        ? "text-violet-600 dark:text-violet-300"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {date.getDate()}
                  </p>
                </header>
                <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <li className="text-center text-[11px] text-zinc-500">—</li>
                  ) : (
                    dayTasks.map((t) => (
                      <li key={t.id}>
                        <motion.button
                          type="button"
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => onSelectTask(t)}
                          className={`w-full rounded-lg border border-l-[3px] border-surface-border bg-zinc-50/90 px-2 py-2 text-left text-xs font-medium text-zinc-900 dark:bg-black/30 dark:text-zinc-100 ${
                            priorityAccent[t.priority]
                          } ${
                            selectedId === t.id
                              ? "ring-1 ring-violet-500/70"
                              : "hover:bg-zinc-100 dark:hover:bg-white/10"
                          } ${t.status === "done" ? "text-zinc-500 line-through opacity-80" : ""}`}
                        >
                          <span className="line-clamp-3">{t.title}</span>
                        </motion.button>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {tasks.filter((t) => t.due_date).length === 0 && (
        <p className="rounded-xl border border-dashed border-surface-border bg-white/40 px-4 py-6 text-center text-sm text-zinc-500 dark:bg-surface-raised/20">
          No tasks with due dates in this list. Add due dates to see them on the calendar.
        </p>
      )}
    </div>
  );
}
