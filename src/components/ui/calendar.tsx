"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

interface CustomCalendarProps {
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  /** Initial month to show when no date is selected (e.g. valid month for passenger type) */
  defaultMonth?: Date | undefined;
  fromYear?: number;
  toYear?: number;
  disabled?: (date: Date) => boolean;
}

export type CalendarProps = React.ComponentProps<typeof DayPicker> & CustomCalendarProps

function Calendar({
  className,
  selected,
  onSelect,
  defaultMonth,
  fromYear = new Date().getFullYear() - 50,
  toYear = new Date().getFullYear() + 10,
  disabled,
  ...rest
}: CalendarProps) {
  void rest // Accept rest props for CalendarProps typing; not passed to DOM
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(() =>
    defaultMonth ?? selected ?? new Date()
  )
  
  // Prefer defaultMonth when selected is outside valid year range so dropdown shows correct year (e.g. 2014 not 1900)
  React.useEffect(() => {
    let target = selected ?? defaultMonth ?? new Date()
    if (selected && (selected.getFullYear() < fromYear || selected.getFullYear() > toYear)) {
      target = defaultMonth ?? new Date()
    }
    setSelectedMonth(target)
  }, [selected?.getTime(), defaultMonth?.getTime(), fromYear, toYear])
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const years = Array.from(
    { length: Math.max(1, toYear - fromYear + 1) },
    (_, i) => fromYear + i
  )
  
  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(monthIndex)
    setSelectedMonth(newDate)
  }
  
  const handleYearChange = (year: number) => {
    const newDate = new Date(selectedMonth)
    newDate.setFullYear(year)
    setSelectedMonth(newDate)
  }
  
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setSelectedMonth(newDate)
  }
  
  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setSelectedMonth(newDate)
  }
  
  const renderCalendarDays = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    
    // Get the first day of the month and the number of days in the month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="h-9"
        />
      );
    }
    
    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      dateObj.setHours(0, 0, 0, 0);
      
      const isToday = 
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear();
        
      const isSelected = selected && 
        dateObj.getDate() === selected.getDate() &&
        dateObj.getMonth() === selected.getMonth() &&
        dateObj.getFullYear() === selected.getFullYear();
      
      const isDisabled = disabled?.(dateObj) ?? false;
      const handleClick = () => {
        if (!isDisabled && onSelect) {
          onSelect(dateObj);
        }
      };
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          className={cn(
            'h-9 w-9 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
            // Default text colors for enabled dates
            'text-gray-900 dark:text-gray-100',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
            isToday && !isSelected && 'bg-gray-100 dark:bg-gray-800 font-bold text-gray-900 dark:text-gray-100',
            isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent pointer-events-none',
            // Outside days (if showing)
            'aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-gray-50'
          )}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className={cn("p-3", className)}>
      {/* Custom Header */}
      <div className="flex items-center justify-between pt-1 pb-2 px-1 w-full">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth.getMonth()}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="h-8 w-full px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 appearance-none cursor-pointer pl-3 pr-8 [&_*]:bg-white dark:[&_option]:bg-gray-800 dark:[&_option]:text-white"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={selectedMonth.getFullYear()}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="h-8 w-full px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 appearance-none cursor-pointer pl-3 pr-8 [&_*]:bg-white dark:[&_option]:bg-gray-800 dark:[&_option]:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Calendar */}
      <div className="w-full">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
