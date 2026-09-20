import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--color-accent)] text-white active:opacity-80 disabled:opacity-40',
  secondary: 'bg-black/[0.05] dark:bg-white/10 text-[var(--color-ink)] active:opacity-70 disabled:opacity-40',
  ghost: 'bg-transparent text-[var(--color-accent)] active:opacity-60 disabled:opacity-40',
  danger: 'bg-[var(--color-bad-soft)] text-[var(--color-bad)] active:opacity-70 disabled:opacity-40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-2 rounded-full gap-1.5',
  md: 'text-[15px] px-5 py-3 rounded-full gap-2',
  lg: 'text-base px-6 py-4 rounded-2xl gap-2',
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none active:scale-[0.97] ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
