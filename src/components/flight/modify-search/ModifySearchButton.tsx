'use client'

import { Edit3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ModifySearchButtonProps {
  onClick: () => void
  className?: string
}

export function ModifySearchButton({ onClick, className }: ModifySearchButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        'flex items-center gap-2 border-2 border-primary/20 hover:border-primary/40 text-primary hover:text-primary',
        className
      )}
    >
      <Edit3 className="h-4 w-4" />
      Modify Search
    </Button>
  )
}