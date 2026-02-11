'use client'

import { Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DynamicButton } from '@/components/ui/dynamic-theme-components'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listSlides, type SlideDocument } from '@/lib/firebase/slides'

export default function SlideshowManager() {
  const [slides, setSlides] = useState<SlideDocument[]>([])
  const [newSrc, setNewSrc] = useState('')
  const [newAlt, setNewAlt] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const refresh = async () => {
    const data = await listSlides()
    setSlides(data)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleAdd = async () => {
    if (!newSrc.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/superadmin/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: newSrc.trim(), alt: newAlt.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add slide')
      setNewSrc('')
      setNewAlt('')
      await refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id?: string) => {
    if (!id) return
    await fetch(`/api/superadmin/slides/${id}`, { method: 'DELETE' })
    await refresh()
  }

  const handleAltUpdate = async (id?: string, alt?: string) => {
    if (!id) return
    await fetch(`/api/superadmin/slides/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: alt ?? '' }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label className="text-gray-900 dark:text-gray-100">Image URL</Label>
          <Input
            placeholder="https://..."
            value={newSrc}
            onChange={(e) => setNewSrc(e.target.value)}
            className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-gray-100">Alt text</Label>
          <Input
            placeholder="Describe the image"
            value={newAlt}
            onChange={(e) => setNewAlt(e.target.value)}
            className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
          />
        </div>
      </div>
      <div>
        <DynamicButton
          variant="primary"
          onClick={() => void handleAdd()}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </DynamicButton>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((s) => (
          <div
            key={s.id}
            className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg overflow-hidden"
          >
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              <Image src={s.src} alt={s.alt ?? ''} fill className="object-cover" unoptimized />
            </div>
            <div className="p-4 space-y-3">
              <Label className="text-xs text-gray-900 dark:text-gray-100">Alt text</Label>
              <Input
                defaultValue={s.alt ?? ''}
                onBlur={(e) => void handleAltUpdate(s.id, e.target.value)}
                placeholder="Describe this image"
                className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg"
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDelete(s.id)}
                  className="flex items-center gap-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
