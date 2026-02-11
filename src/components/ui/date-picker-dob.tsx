"use client"

import { format } from "date-fns"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerDOBProps {
  value?: string | undefined // ISO date string (YYYY-MM-DD)
  onChange: (date: string | undefined) => void
  placeholder?: string | undefined
  minDate?: Date | undefined
  maxDate?: Date | undefined
  /** When no date is selected, open calendar to this month (e.g. valid month for passenger type) */
  defaultMonth?: Date | undefined
  disabled?: boolean | undefined
  className?: string | undefined
}

export function DatePickerDOB({
  value,
  onChange,
  placeholder = "Select date",
  minDate,
  maxDate,
  defaultMonth,
  disabled = false,
  className,
}: DatePickerDOBProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value)
      if (!isNaN(newDate.getTime())) {
        setDate(newDate)
      }
    } else {
      setDate(undefined)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
      const day = String(selectedDate.getDate()).padStart(2, "0")
      onChange(`${year}-${month}-${day}`)
      setOpen(false)
    } else {
      onChange(undefined)
    }
  }

  const disabledFn = React.useCallback(
    (d: Date) => {
      if (minDate && d < minDate) return true
      if (maxDate && d > maxDate) return true
      return false
    },
    [minDate, maxDate]
  )

  const fromYear = minDate ? minDate.getFullYear() : 1900
  const toYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear()

  // Only use selected date as defaultMonth when it's within valid range; otherwise use defaultMonth
  // so the calendar opens to a valid month (e.g. Jan 2014 for Adult) and year dropdown shows correct value
  const calendarDefaultMonth = React.useMemo(() => {
    if (date && minDate && maxDate) {
      const d = date.getTime()
      if (d >= minDate.getTime() && d <= maxDate.getTime()) return date
    }
    return defaultMonth ?? undefined
  }, [date, defaultMonth, minDate, maxDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent",
            !date && "text-gray-500 dark:text-gray-400",
            date && "text-gray-900 dark:text-white",
            className
          )}
        >
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={date}
          onSelect={handleDateSelect}
          {...(calendarDefaultMonth != null && { defaultMonth: calendarDefaultMonth })}
          fromYear={fromYear}
          toYear={toYear}
          disabled={disabledFn}
        />
      </PopoverContent>
    </Popover>
  )
}
