import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: `bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25
    ring-1 ring-inset ring-white/15 hover:from-violet-400 hover:to-violet-500 active:from-violet-600 active:to-violet-700`,
  secondary: `border border-white/[0.12] bg-white/[0.05] text-gray-100 shadow-sm shadow-black/20 backdrop-blur-md
    hover:bg-white/[0.08] hover:border-white/[0.18] active:bg-white/[0.06]`,
  ghost: `text-gray-400 hover:bg-white/[0.06] hover:text-gray-100 active:bg-white/[0.04]`,
  danger: `border border-red-500/25 bg-red-500/10 text-red-300 shadow-sm shadow-red-950/40
    hover:bg-red-500/15 hover:border-red-400/35 active:bg-red-500/20`,
}

const sizeClasses: Record<Size, string> = {
  sm: 'gap-1.5 px-3 py-1.5 text-xs rounded-lg',
  md: 'gap-2 px-4 py-2.5 text-sm rounded-xl',
  lg: 'gap-2 px-5 py-3 text-base rounded-xl',
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`size-4 shrink-0 animate-spin ${className ?? ''}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      className = '',
      disabled,
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: isDisabled ? 1 : 1.015 }}
        whileTap={{ scale: isDisabled ? 1 : 0.985 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className={`inline-flex items-center justify-center font-medium tracking-tight transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2
          focus-visible:ring-offset-gray-950
          disabled:opacity-45 disabled:pointer-events-none
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
