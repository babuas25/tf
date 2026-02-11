'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

import { TravellerForm } from '@/components/travellers/TravellerForm'
import { TravellersList, type Traveller } from '@/components/travellers/TravellersList'
import { ROLES, type RoleType } from '@/lib/utils/constants'
import { type TravellerFormData } from '@/lib/utils/validation'

export default function UserTravellersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [travellers, setTravellers] = useState<Traveller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTraveller, setEditingTraveller] = useState<Traveller | null>(null)

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

  // Redirect if not authenticated or not User
  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (!role || role !== ROLES.USER) {
      router.push('/auth')
      return
    }
  }, [session, status, router])

  const handleAddTraveller = () => {
    setShowAddForm(true)
  }

  const handleEditTraveller = (id: string) => {
    const travellerToEdit = travellers.find((t) => t.id === id)
    if (travellerToEdit) {
      setEditingTraveller(travellerToEdit)
      setShowAddForm(true)
    }
  }

  const handleFormSubmit = async (formData: TravellerFormData) => {
    try {
      setIsLoading(true)

      if (editingTraveller) {
        // Update existing traveller
        const response = await fetch(`/api/travellers/${editingTraveller.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const raw: unknown = await response.json()
          const updatedTraveller =
            raw &&
            typeof raw === 'object' &&
            'traveller' in raw &&
            isTraveller((raw as Record<string, unknown>).traveller)
              ? (raw as { traveller: Traveller }).traveller
              : null
          if (updatedTraveller) {
            setTravellers((prev) =>
              prev.map((t) => (t.id === updatedTraveller.id ? updatedTraveller : t)),
            )
          }
        }
      } else {
        // Create new traveller
        const response = await fetch('/api/travellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          const raw: unknown = await response.json()
          const createdTraveller =
            raw &&
            typeof raw === 'object' &&
            'traveller' in raw &&
            isTraveller((raw as Record<string, unknown>).traveller)
              ? (raw as { traveller: Traveller }).traveller
              : null
          if (createdTraveller) {
            setTravellers((prev) => [...prev, createdTraveller])
          }
        }
      }

      setShowAddForm(false)
      setEditingTraveller(null)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshTravellers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/travellers')

      if (response.ok) {
        const raw: unknown = await response.json()
        const travellersList =
          raw && typeof raw === 'object' && 'travellers' in raw
            ? parseTravellerArray((raw as Record<string, unknown>).travellers)
            : []
        setTravellers(travellersList)
      }
    } catch (error) {
      console.error('Error fetching travellers:', error)
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

      {/* Add Traveller Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[75vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {editingTraveller ? 'Edit Traveller' : 'Add New Traveller'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingTraveller(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl p-1"
                >
                  ×
                </button>
              </div>

              <TravellerForm
                initialData={editingTraveller}
                onSubmit={(data) => void handleFormSubmit(data)}
                onCancel={() => {
                  setShowAddForm(false)
                  setEditingTraveller(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
