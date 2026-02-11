'use client'

import { useMemo, useState } from 'react'

import { useThemeSystem } from '@/components/theme-provider'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { THEME_NAMES, ThemeName } from '@/lib/themeColors'

export default function ThemeSelector() {
  const { color, mode, setColor, setMode } = useThemeSystem()
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  const themeOptions = useMemo(
    () => THEME_NAMES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
    [],
  )
  const modeOptions = useMemo(
    () => [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    [],
  )

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const closeAllDropdowns = () => setOpenDropdowns(new Set())

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="text-sm min-w-16 text-gray-700 dark:text-gray-300">Theme:</label>
        <div className="w-48">
          <CustomDropdown
            id="theme-selector"
            value={color}
            options={themeOptions}
            onChange={(v) => setColor(v as ThemeName)}
            openDropdowns={openDropdowns}
            onToggleDropdown={toggleDropdown}
            onCloseAllDropdowns={closeAllDropdowns}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm min-w-16 text-gray-700 dark:text-gray-300">Mode:</label>
        <div className="w-48">
          <CustomDropdown
            id="mode-selector"
            value={mode}
            options={modeOptions}
            onChange={(v) => setMode(v as 'light' | 'dark')}
            openDropdowns={openDropdowns}
            onToggleDropdown={toggleDropdown}
            onCloseAllDropdowns={closeAllDropdowns}
          />
        </div>
      </div>
    </div>
  )
}
