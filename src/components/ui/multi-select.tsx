import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options:       Option[]
  value:         string[]
  onChange:      (value: string[]) => void
  placeholder?:  string
  className?:    string
}

export function MultiSelect({ options, value, onChange, placeholder = 'Select…', className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  // Build trigger label
  let label: React.ReactNode
  if (value.length === 0) {
    label = <span className="text-muted-foreground">{placeholder}</span>
  } else if (value.length <= 2) {
    const names = value.map((v) => options.find((o) => o.value === v)?.label ?? v)
    label = <span className="truncate">{names.join(', ')}</span>
  } else {
    label = <span>{value.length} selected</span>
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className={cn(
            'flex h-8 min-w-[9rem] items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 text-xs shadow-sm transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring',
            className,
          )}
        >
          <span className="flex-1 text-left overflow-hidden">{label}</span>
          <span className="flex items-center gap-0.5 shrink-0">
            {value.length > 0 && (
              <span onClick={clear} className="rounded p-0.5 hover:bg-muted-foreground/20">
                <X className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-[10rem] rounded-md border bg-background p-1 shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {options.map((opt) => {
            const checked = value.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                <span className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                  checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                )}>
                  {checked && <Check className="h-2.5 w-2.5" />}
                </span>
                {opt.label}
              </button>
            )
          })}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
