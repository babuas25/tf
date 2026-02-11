'use client'

import { Plane } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AirlineLogoProps {
  airlineId: string
  className?: string
  size?: number
}

export function AirlineLogo({ airlineId, className = '', size = 64 }: AirlineLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    // Use the kiwi.com URL format for airline logos
    const logoUrl = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`
    setLogoUrl(logoUrl)
    setImgError(false)
  }, [airlineId])

  if (imgError || !logoUrl) {
    return (
      <div
        className={`rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Plane className="w-1/2 h-1/2 text-gray-400" />
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={`${airlineId} airline logo`}
      className={`rounded flex-shrink-0 ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setImgError(true)}
    />
  )
}
