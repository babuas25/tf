'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DateNavigatorSize = 'mobile' | 'desktop'

interface DateShiftNavigatorProps {
  dateLabel: string
  dateValue: string
  onDateShift?: (days: number) => void
  onDateSelect?: (date: string) => void
  disabled?: boolean
  size?: DateNavigatorSize
  className?: string
}

function parseIsoDate(dateValue: string): Date | undefined {
  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isPastDate(date: Date): boolean {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return target < today
}

export function DateShiftNavigator({
  dateLabel,
  dateValue,
  onDateShift,
  onDateSelect,
  disabled = false,
  size = 'mobile',
  className,
}: DateShiftNavigatorProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => parseIsoDate(dateValue), [dateValue])
  const canShift = !disabled && Boolean(onDateShift)
  const canPickDate = !disabled && Boolean(onDateSelect)

  const arrowButtonClass = size === 'desktop' ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <div
      className={cn(
        'flex items-center justify-between bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-sm',
        size === 'desktop' ? 'px-2 py-1 min-w-[170px]' : 'px-2 py-1.5',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onDateShift?.(-1)}
        disabled={!canShift}
        className={cn(
          arrowButtonClass,
          'inline-flex items-center justify-center rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        )}
        aria-label="Previous date"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={!canPickDate}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Choose date"
          >
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span>{dateLabel}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-auto p-0 border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900"
        >
          <Calendar
            selected={selectedDate}
            onSelect={(date) => {
              if (!date || !onDateSelect) return
              onDateSelect(toIsoDate(date))
              setOpen(false)
            }}
            {...(selectedDate && { defaultMonth: selectedDate })}
            disabled={isPastDate}
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => onDateShift?.(1)}
        disabled={!canShift}
        className={cn(
          arrowButtonClass,
          'inline-flex items-center justify-center rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        )}
        aria-label="Next date"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
