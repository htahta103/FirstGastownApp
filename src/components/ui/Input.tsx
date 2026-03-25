import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-100
            shadow-inner shadow-black/20 backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-200
            placeholder:text-gray-600
            border-white/[0.08] hover:border-white/[0.12]
            focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20 focus:outline-none
            focus:scale-[1.01]
            ${error ? 'border-red-400/40 focus:border-red-400/50 focus:ring-red-500/15' : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint && `${inputId}-hint`, error && `${inputId}-err`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-600">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-err`} role="alert" className="text-xs text-red-400/90">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
