'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface CustomDropdownProps {
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  openDropdowns: Set<string>
  onToggleDropdown: (id: string) => void
  onCloseAllDropdowns: () => void
}

export function CustomDropdown({
  id,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select option',
  openDropdowns,
  onToggleDropdown,
  onCloseAllDropdowns,
}: CustomDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const isOpen = openDropdowns.has(id)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onCloseAllDropdowns()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onCloseAllDropdowns])

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const dropdownHeight = Math.min(options.length * 40 + 16, 200) // Max height of 200px
      const dropdownWidth = Math.max(rect.width, 120) // Min width of 120px

      // Check if dropdown would overflow bottom of viewport
      const wouldOverflowBottom = rect.bottom + dropdownHeight > viewportHeight - 20 // 20px margin from bottom

      // Check if dropdown would overflow right of viewport
      const wouldOverflowRight = rect.left + dropdownWidth > viewportWidth - 20 // 20px margin from right

      setPosition({
        top: wouldOverflowBottom ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: wouldOverflowRight ? rect.right - dropdownWidth : rect.left,
        width: dropdownWidth,
      })
    }
  }, [isOpen, options.length])

  const handleToggle = () => {
    if (!disabled) {
      onToggleDropdown(id)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    onCloseAllDropdowns()
  }

  if (!mounted) {
    return (
      <button
        ref={buttonRef}
        disabled={disabled}
        className="w-full h-8 px-3 py-1 text-left bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className="w-4 h-4 ml-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full h-8 px-3 py-1 text-left bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className="w-4 h-4 ml-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white/20 backdrop-blur-md border border-white/30 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              minWidth: '120px',
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className="w-full px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-white/30 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
