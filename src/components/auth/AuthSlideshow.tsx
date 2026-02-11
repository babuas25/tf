'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { listSlides, type SlideDocument } from '@/lib/firebase/slides'

type Slide = SlideDocument & { id: string }

const AUTO_PLAY_MS = 4500

export function AuthSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    listSlides()
      .then((docs) => {
        if (!mounted) return
        const withIds = docs.map((d, i) => ({ id: d.id ?? String(i), ...d })) as Slide[]
        setSlides(withIds)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, AUTO_PLAY_MS)
    return () => clearInterval(interval)
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="relative hidden lg:block lg:w-1/2 overflow-hidden bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-200 dark:from-slate-800 dark:via-slate-700 dark:to-indigo-800" />
    )
  }

  return (
    <div className="relative hidden lg:block lg:w-1/2 overflow-hidden">
      {slides.map((slide, i) => {
        const isActive = i === index
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt ?? ''}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              unoptimized
              onError={(e) => {
                const target = e.target as unknown as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-slate-700/30 to-transparent" />
            {slide.alt && (
              <div className="absolute bottom-8 left-8 right-8">
                <blockquote className="max-w-md text-white text-lg leading-relaxed backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
                  &ldquo;{slide.alt}&rdquo;
                </blockquote>
                <div className="mt-2 h-1 w-24 bg-white/70 rounded-full" />
              </div>
            )}
          </div>
        )
      })}

      {/* Dots */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 backdrop-blur-sm bg-white/10 rounded-full p-2 border border-white/20">
        {slides.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i === index ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default AuthSlideshow
