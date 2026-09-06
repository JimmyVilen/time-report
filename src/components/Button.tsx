import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--accent)] text-white border border-[var(--accent)] shadow-[0_8px_20px_rgba(13,81,71,0.13)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]',
  secondary: 'bg-[var(--background-card)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  danger: 'bg-[var(--danger)] text-white border border-[var(--danger)] hover:bg-[var(--danger-hover)]',
  ghost: 'text-[var(--foreground-muted)] border border-transparent hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[0.95rem]',
  md: 'px-4 py-2.5 text-[1.02rem]',
  lg: 'px-6 py-3 text-[1.08rem]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  className = '',
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={`
      font-display inline-flex items-center justify-center gap-2 font-[650] rounded-md tracking-[0.005em] transition-all
      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
      ${variantClasses[variant]} ${sizeClasses[size]} ${className}
    `}
    {...props}
  >
    {loading && <span className="animate-spin">⟳</span>}
    {children}
  </button>
))
Button.displayName = 'Button'
