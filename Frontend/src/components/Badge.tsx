type Color = 'blue' | 'gray' | 'green' | 'red' | 'yellow'

interface BadgeProps {
  color?: Color
  children: React.ReactNode
  className?: string
}

const colorClasses: Record<Color, string> = {
  blue: 'bg-[#e8eef0] text-[#31596a] border border-[#cadbe1]',
  gray: 'bg-[var(--background-elevated)] text-[var(--foreground-muted)] border border-[var(--border)]',
  green: 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[#c8dad5]',
  red: 'bg-[#f8e9e6] text-[var(--danger)] border border-[#ebcbc5]',
  yellow: 'bg-[var(--champagne-soft)] text-[#7e5c2b] border border-[#e2d0ae]',
}

export function Badge({ color = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  )
}
