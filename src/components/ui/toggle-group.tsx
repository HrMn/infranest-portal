import { cn } from '@/lib/utils'

interface Option<T extends string> {
  value: T
  label: string
}

interface ToggleGroupProps<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
}

export function ToggleGroup<T extends string>({ value, options, onChange, className }: ToggleGroupProps<T>) {
  return (
    <div className={cn('inline-flex rounded-md bg-muted/60 p-0.5 gap-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded px-3 py-1 text-xs font-medium transition-all',
            value === opt.value
              ? 'bg-primary/15 text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
