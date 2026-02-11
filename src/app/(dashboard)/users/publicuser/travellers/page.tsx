'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { TravellerFormModal } from '@/components/travellers/TravellerFormModal'
import { TravellersList, type Traveller } from '@/components/travellers/TravellersList'
import { ROLES, type RoleType } from '@/lib/utils/constants'
import { type TravellerFormData } from '@/lib/utils/validation'

const isTraveller = (value: unknown): value is Traveller => {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.id === 'string' &&
    typeof obj.ptc === 'string' &&
    typeof obj.givenName === 'string' &&
    typeof obj.surname === 'string' &&
    typeof obj.gender === 'string' &&
    typeof obj.nationality === 'string' &&
    typeof obj.phoneNumber === 'string'
  )
}

const parseTravellerArray = (value: unknown): Traveller[] => {
  if (!Array.isArray(value)) return []
  return value.filter(isTraveller)
}

export default function UserTravellersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [travellers, setTravellers] = useState<Traveller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTraveller, setEditingTraveller] = useState<Traveller | null>(null)

  const refreshTravellers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/travellers')
      if (!response.ok) return

      const raw: unknown = await response.json()
      const travellersList =
        raw && typeof raw === 'object' && 'travellers' in raw
          ? parseTravellerArray((raw as Record<string, unknown>).travellers)
          : []
      setTravellers(travellersList)
    } catch (error) {
      console.error('Error fetching travellers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (!role || role !== ROLES.USER) {
      router.push('/auth')
    }
  }, [router, session, status])

  useEffect(() => {
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (role === ROLES.USER) {
      void refreshTravellers()
    }
  }, [session])

  const handleAddTraveller = () => {
    setEditingTraveller(null)
    setShowForm(true)
  }

  const handleEditTraveller = (id: string) => {
    const traveller = travellers.find((item) => item.id === id)
    if (!traveller) return

    setEditingTraveller(traveller)
    setShowForm(true)
  }

  const handleFormSubmit = async (formData: TravellerFormData) => {
    try {
      setIsLoading(true)

      if (editingTraveller) {
        const response = await fetch(`/api/travellers/${editingTraveller.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const error = (await response.json()) as { error?: string }
          alert(`Error updating traveller: ${error.error || 'Unknown error'}`)
          return
        }

        const raw: unknown = await response.json()
        const updatedTraveller =
          raw &&
          typeof raw === 'object' &&
          'traveller' in raw &&
          isTraveller((raw as Record<string, unknown>).traveller)
            ? ((raw as { traveller: Traveller }).traveller ?? null)
            : null

        if (updatedTraveller) {
          setTravellers((prev) => prev.map((item) => (item.id === updatedTraveller.id ? updatedTraveller : item)))
        }
      } else {
        const response = await fetch('/api/travellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const error = (await response.json()) as { error?: string }
          alert(`Error creating traveller: ${error.error || 'Unknown error'}`)
          return
        }

        const raw: unknown = await response.json()
        const createdTraveller =
          raw &&
          typeof raw === 'object' &&
          'traveller' in raw &&
          isTraveller((raw as Record<string, unknown>).traveller)
            ? ((raw as { traveller: Traveller }).traveller ?? null)
            : null

        if (createdTraveller) {
          setTravellers((prev) => [...prev, createdTraveller])
        }
      }

      setShowForm(false)
      setEditingTraveller(null)
    } catch (error) {
      console.error('Error submitting traveller form:', error)
      alert('Failed to save traveller. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session || (session?.user as { role?: RoleType } | undefined)?.role !== ROLES.USER) {
    return null
  }

  return (
    <>
      <TravellersList
        travellers={travellers}
        role="User"
        canDelete={false}
        onAddTraveller={handleAddTraveller}
        onEditTraveller={handleEditTraveller}
        onRefresh={() => void refreshTravellers()}
        isLoading={isLoading}
      />

      <TravellerFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingTraveller(null)
        }}
        onSubmit={(data) => void handleFormSubmit(data)}
        initialData={editingTraveller}
        isEditing={Boolean(editingTraveller)}
      />
    </>
  )
}
