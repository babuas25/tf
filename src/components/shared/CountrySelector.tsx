'use client'

import { ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ReactCountryFlag from 'react-country-flag'

interface Country {
  code: string
  name: string
  flag: string
  phoneCode?: string
}

interface CountrySelectorProps {
  value: string
  onChange: (value: string) => void
  countries: Country[]
  placeholder?: string
  className?: string
  type?: 'nationality' | 'phone'
}

export function CountrySelector({
  value,
  onChange,
  countries,
  placeholder = 'Select country',
  className = '',
  type = 'nationality',
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 0,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedCountry = countries.find((country) =>
    type === 'phone' ? country.phoneCode === value : country.code === value,
  )

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (country.phoneCode && country.phoneCode.includes(searchTerm)),
  )

  const handleSelect = (country: Country) => {
    const newValue = type === 'phone' ? country.phoneCode || country.code : country.code
    onChange(newValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      let newTop = rect.bottom
      let newMaxHeight = spaceBelow - 10 // 10px padding from bottom

      // If not enough space below, try to open upwards
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        // 200 is arbitrary min height for dropdown
        newTop = rect.top - Math.min(250, spaceAbove - 10) // 250 is max dropdown height, 10px padding from top
        newMaxHeight = Math.min(250, spaceAbove - 10)
      }

      const newPosition = {
        top: newTop,
        left: rect.left,
        width: type === 'phone' ? Math.max(rect.width, 200) : rect.width, // Minimum 200px width for phone type
        maxHeight: newMaxHeight,
      }
      setDropdownPosition(newPosition)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition()
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setTimeout(() => updateDropdownPosition(), 0)
          }
        }}
        className="w-full max-w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm overflow-hidden"
      >
        <div className="flex items-center gap-2">
          {selectedCountry && (
            <ReactCountryFlag
              countryCode={selectedCountry.code}
              svg
              style={{
                width: '1.25rem',
                height: '1.25rem',
              }}
              title={selectedCountry.name}
            />
          )}
          <span className="text-sm truncate flex-1 min-w-0">
            {selectedCountry
              ? type === 'phone'
                ? `${selectedCountry.phoneCode}`
                : `${selectedCountry.name}`
              : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <input
              type="text"
              placeholder="Search country..."
              className="w-full max-w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Country List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected =
                  type === 'phone' ? country.phoneCode === value : country.code === value

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode={country.code}
                      svg
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                      }}
                      title={country.name}
                    />
                    <span className="flex-1 text-left">{country.name}</span>
                    {type === 'phone' && (
                      <span className="text-gray-500 dark:text-gray-400">{country.phoneCode}</span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
