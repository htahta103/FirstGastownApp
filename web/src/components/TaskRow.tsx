import { motion } from "framer-motion";
import type { Task } from "../types";

const priorityAccent: Record<Task["priority"], string> = {
  urgent: "bg-rose-500",
  high: "bg-amber-500",
  medium: "bg-sky-500",
  low: "bg-zinc-500",
};

const statusLabel: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export interface TaskRowProps {
  task: Task;
  selected: boolean;
  onSelect: (task: Task) => void;
}

export function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const sub = task.subtask_total > 0 ? `${task.subtask_completed}/${task.subtask_total}` : null;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={() => onSelect(task)}
      className={`group flex w-full items-stretch gap-0 overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-violet-500/60 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
          : "border-surface-border bg-surface-raised/60 hover:border-zinc-600 hover:bg-surface-raised"
      }`}
    >
      <span className={`w-1 shrink-0 ${priorityAccent[task.priority]}`} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`truncate font-medium tracking-tight ${
              task.status === "done" ? "text-zinc-500 line-through" : "text-zinc-100"
            }`}
          >
            {task.title}
          </span>
          <span className="shrink-0 rounded-md border border-surface-border bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {statusLabel[task.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {task.due_date && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-zinc-400">
              Due {task.due_date}
            </span>
          )}
          <span className="capitalize text-zinc-500">{task.priority}</span>
          {sub && (
            <span className="text-zinc-500">
              Subtasks <span className="font-mono text-zinc-400">{sub}</span>
            </span>
          )}
          {task.tags?.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {task.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: t.color || "#6366f1" }}
                >
                  {t.name}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
