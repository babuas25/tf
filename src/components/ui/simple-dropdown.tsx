'use client'

import { ChevronDown } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SimpleDropdownProps {
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SimpleDropdown({
  id: _id,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select option',
}: SimpleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is on dropdown button or inside the portal menu
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !(target instanceof Element && target.closest('.dropdown-menu-portal'))
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Measure and set menu position relative to viewport to avoid clipping
  const measure = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuRect({ top: rect.bottom, left: rect.left, width: rect.width })
  }

  useEffect(() => {
    if (!isOpen) return
    measure()
    const onScroll = () => measure()
    const onResize = () => measure()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find((option) => option.value === value)

  // Format label: convert to lowercase then capitalize each word
  const formatLabel = (label: string) => {
    return label.toLowerCase()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        ref={buttonRef}
        className="w-full max-w-full min-h-[42px] px-3 py-2 text-left rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between transition-colors border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent overflow-hidden"
      >
        <span className="truncate text-sm font-medium flex-1 min-w-0">
          {selectedOption
            ? selectedOption.value === ''
              ? selectedOption.label
              : formatLabel(selectedOption.label)
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            className="dropdown-menu-portal"
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: Math.max(8, Math.min(menuRect.left, window.innerWidth - menuRect.width - 8)),
              width: Math.min(menuRect.width, window.innerWidth - 16),
              zIndex: 9999,
            }}
          >
            <div className="mt-1 bg-white dark:bg-neutral-950 border border-gray-200/80 dark:border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto max-w-full">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full max-w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg truncate ${
                    option.value === value
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold'
                      : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {option.value === '' ? option.label : formatLabel(option.label)}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
