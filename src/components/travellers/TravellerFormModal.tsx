'use client'

import { Pencil, UserRoundPlus, X } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { type TravellerFormData } from '@/lib/utils/validation'

import { TravellerForm } from './TravellerForm'
import { type Traveller } from './TravellersList'

interface TravellerFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TravellerFormData) => void
  initialData?: Traveller | null
  isEditing?: boolean
}

export function TravellerFormModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}: TravellerFormModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const title = isEditing ? 'Edit Traveller' : 'Add Traveller'

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div className="h-full w-full flex items-center justify-center">
        <div
          className="w-full max-w-5xl max-h-[90vh] rounded-2xl border border-white/30 dark:border-white/20 bg-white/95 dark:bg-neutral-950 shadow-2xl overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 border-b border-white/30 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-sm px-4 md:px-6 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {isEditing ? <Pencil className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Fill traveller details clearly before saving.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close traveller form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
            <TravellerForm
              onSubmit={onSubmit}
              onCancel={onClose}
              initialData={initialData}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
