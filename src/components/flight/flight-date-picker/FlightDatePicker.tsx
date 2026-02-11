'use client'

// Flight Date Picker Component - Fixed date selection
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FlightDatePickerProps {
  label: string
  value: string
  onChange: (date: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  minDate?: string
  openToDate?: string
}

function formatDisplayDate(value: string) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(d)
  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
  const weekday = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(d)
  return { day, month, year, weekday }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function FlightDatePicker({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select date',
  className = '',
  minDate,
  openToDate,
}: FlightDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [initialized, setInitialized] = useState(false)
  const [calendarPosition, setCalendarPosition] = useState<
    'bottom' | 'top' | 'right' | 'left' | 'viewport-top'
  >('bottom')
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const displayDate = formatDisplayDate(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  const selectedDate = value ? new Date(value) : null
  const openTo = openToDate ? new Date(openToDate) : null
  const minimumDate = minDate ? new Date(minDate) : today
  minimumDate.setHours(0, 0, 0, 0) // Ensure we're comparing just the date part

  const minimumMonthKey = minimumDate.getFullYear() * 12 + minimumDate.getMonth()
  const currentMonthKey = currentYear * 12 + currentMonth
  const isPrevDisabled = currentMonthKey < minimumMonthKey

  useEffect(() => {
    if (!isOpen) return
    if (initialized) return

    const anchor = (openTo && !Number.isNaN(openTo.getTime()))
      ? openTo
      : (selectedDate && !Number.isNaN(selectedDate.getTime()))
        ? selectedDate
        : minimumDate

    const anchorKey = anchor.getFullYear() * 12 + anchor.getMonth()
    const clampedKey = Math.max(anchorKey, minimumMonthKey)
    const clampedYear = Math.floor(clampedKey / 12)
    const clampedMonth = clampedKey % 12

    setCurrentYear(clampedYear)
    setCurrentMonth(clampedMonth)
    setInitialized(true)
  }, [isOpen, openTo, selectedDate, minimumDate, minimumMonthKey, initialized])

  // Calculate calendar position based on available space
  const calculatePosition = () => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const calendarHeight = 380
    const calendarWidth = 320

    // On mobile screens, be more aggressive about positioning
    if (viewportWidth < 768) {
      // Mobile breakpoint
      const spaceBelow = viewportHeight - rect.bottom - 20

      // If there's not enough space below (common on mobile), use viewport-top
      if (spaceBelow < calendarHeight) {
        setCalendarPosition('viewport-top')
        return
      }

      // If there's enough space below, use bottom positioning
      setCalendarPosition('bottom')
      return
    }

    // On larger screens, prefer right positioning like in AppDashboard
    if (viewportWidth >= 1024) {
      // lg breakpoint
      const spaceRight = viewportWidth - rect.right - 20
      const spaceLeft = rect.left - 20

      if (spaceRight >= calendarWidth) {
        setCalendarPosition('right')
        return
      } else if (spaceLeft >= calendarWidth) {
        setCalendarPosition('left')
        return
      }
    }

    // Fallback to vertical positioning for tablets/small desktops
    const spaceBelow = viewportHeight - rect.bottom - 20
    const spaceAbove = rect.top - 20

    if (spaceBelow >= calendarHeight) {
      setCalendarPosition('bottom')
    } else if (spaceAbove >= calendarHeight) {
      setCalendarPosition('top')
    } else {
      // On small screens, position at viewport top
      setCalendarPosition('viewport-top')
    }
  }

  // Close calendar when clicking outside and handle scroll/resize
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      // Check if click is outside both the trigger button and calendar
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleResize() {
      if (isOpen) {
        calculatePosition()
      }
    }

    function handleScroll() {
      if (isOpen) {
        calculatePosition()
      }
    }

    if (isOpen) {
      // Small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isOpen])

  const handleToggleCalendar = () => {
    if (!disabled) {
      if (!isOpen) {
        calculatePosition()
      }
      setIsOpen(!isOpen)
    }
  }

  const handleDateClick = (day: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const newDate = new Date(currentYear, currentMonth, day)
    newDate.setHours(0, 0, 0, 0)

    // Check if date is disabled (before minimum date, but allow same day)
    if (newDate.getTime() < minimumDate.getTime()) {
      return // Don't allow selection of disabled dates
    }

    const dateString = formatDateToString(newDate)
    onChange(dateString)
    // Close calendar after selection
    setTimeout(() => setIsOpen(false), 0)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (isPrevDisabled) return
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const renderCalendar = () => {
    if (!containerRef.current) return null

    const rect = containerRef.current.getBoundingClientRect()
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(
      new Date(currentYear, currentMonth),
    )

    const days = []
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      date.setHours(0, 0, 0, 0)

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      const isSelected =
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()

      // For return date picker, allow same day as departure
      // Only disable if date is actually before the minimum date (not same day)
      const isDisabled = date.getTime() < minimumDate.getTime()

      days.push(
        <button
          key={day}
          type="button"
          onClick={(event) => handleDateClick(day, event)}
          disabled={isDisabled}
          className={cn(
            'h-10 w-10 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
            // Default text colors for enabled dates
            !isDisabled && !isSelected && 'text-gray-900 dark:text-gray-100',
            !isDisabled && 'hover:bg-gray-100 dark:hover:bg-gray-800',
            isSelected && !isDisabled && 'bg-primary text-primary-foreground hover:bg-primary/90',
            isToday && !isSelected && !isDisabled && 'bg-gray-100 dark:bg-gray-800 font-bold text-gray-900 dark:text-gray-100',
            isDisabled && 'text-gray-300 dark:text-gray-500 cursor-not-allowed',
          )}
        >
          {day}
        </button>,
      )
    }

    const getCalendarPosition = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // On mobile, always center the calendar regardless of trigger position
      if (viewportWidth < 768) {
        const calendarWidth = 320
        const calendarHeight = 380
        const centerX = Math.max(10, (viewportWidth - calendarWidth) / 2)

        switch (calendarPosition) {
          case 'top': {
            return {
              left: centerX,
              top: Math.max(20, rect.top - calendarHeight - 10),
            }
          }
          case 'viewport-top': {
            return {
              left: centerX,
              top: 20,
            }
          }
          default: {
            // bottom or any other position on mobile
            // Check if there's enough space below, otherwise use viewport-top
            const spaceBelow = viewportHeight - rect.bottom - 20
            if (spaceBelow < calendarHeight) {
              return {
                left: centerX,
                top: 20, // Always position at top when no space below
              }
            }
            return {
              left: centerX,
              top: rect.bottom + 8,
            }
          }
        }
      }

      // Desktop positioning (unchanged)
      switch (calendarPosition) {
        case 'right': {
          return {
            left: rect.right + 8,
            top: rect.top,
          }
        }
        case 'left': {
          return {
            left: rect.left - 320 - 8,
            top: rect.top,
          }
        }
        case 'top': {
          return {
            left: rect.left,
            top: rect.top - 380,
          }
        }
        case 'viewport-top': {
          return {
            left: Math.max(10, (viewportWidth - 320) / 2),
            top: 20,
          }
        }
        default: {
          // bottom
          return {
            left: rect.left,
            top: rect.bottom + 8,
          }
        }
      }
    }

    const calendarElement = (
      <>
        {/* Backdrop for mobile */}
        {window.innerWidth < 768 && (
          <div
            className="fixed inset-0 bg-black/20 z-[9998]"
            onMouseDown={(e) => {
              // Only close if clicking the backdrop itself, not the calendar
              if (e.target === e.currentTarget) {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
              }
            }}
          />
        )}

        <Card
          ref={calendarRef}
          className={cn(
            'fixed p-4 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-white/10 shadow-lg min-w-[320px] z-[9999]',
            window.innerWidth < 768 && 'max-h-[calc(100vh-40px)] overflow-auto',
          )}
          style={getCalendarPosition()}
          onMouseDown={(e) => {
            // Prevent clicks inside calendar from closing it
            e.stopPropagation()
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={isPrevDisabled}
              className="h-8 w-8 p-0 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {monthName} {currentYear}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="h-8 w-8 p-0 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </Card>
      </>
    )

    // Render calendar in a portal to avoid clipping
    return createPortal(calendarElement, document.body)
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full', className)}
      style={{ minHeight: 'auto', height: '100%' }}
    >
      <button
        type="button"
        onClick={handleToggleCalendar}
        disabled={disabled}
        className={cn(
          'relative rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-3 lg:px-4 lg:py-3 h-full min-h-[90px] lg:min-h-[140px] flex flex-col justify-center w-full text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/40',
          disabled && 'opacity-60 cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5',
          className,
        )}
        style={{ minHeight: 'auto', height: '100%' }}
      >
        <div className="flex flex-col justify-center flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
          {displayDate ? (
            <div>
              <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">
                {displayDate.day} {displayDate.month} {displayDate.year}
              </div>
              <div className="text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400">
                {displayDate.weekday}
              </div>
            </div>
          ) : (
            <div className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">
              {placeholder}
            </div>
          )}
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
      </button>

      {isOpen && renderCalendar()}
    </div>
  )
}
