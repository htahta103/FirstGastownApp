import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? props.name
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-xl border bg-white/[0.03] py-2.5 pl-3.5 pr-10 text-sm
              text-gray-100 shadow-inner shadow-black/20 backdrop-blur-sm transition-colors
              border-white/[0.08] hover:border-white/[0.12]
              focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20 focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-45
              ${error ? 'border-red-400/40 focus:border-red-400/50 focus:ring-red-500/15' : ''} ${className}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [hint && `${selectId}-hint`, error && `${selectId}-err`]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-xs text-gray-600">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${selectId}-err`} role="alert" className="text-xs text-red-400/90">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Select.displayName = 'Select'
