/** Simple inline illustration for empty task states */
export function TasksEmptyIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="24" y="20" width="152" height="112" rx="12" className="stroke-white/10" strokeWidth="1.5" />
      <rect x="40" y="40" width="88" height="8" rx="4" className="fill-white/[0.06]" />
      <rect x="40" y="56" width="64" height="8" rx="4" className="fill-white/[0.04]" />
      <rect x="40" y="76" width="120" height="8" rx="4" className="fill-white/[0.05]" />
      <rect x="40" y="92" width="96" height="8" rx="4" className="fill-white/[0.04]" />
      <circle cx="152" cy="48" r="18" className="stroke-violet-500/40" strokeWidth="1.5" />
      <path
        d="M145 48 L150 53 L160 42"
        className="stroke-violet-400/70"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
