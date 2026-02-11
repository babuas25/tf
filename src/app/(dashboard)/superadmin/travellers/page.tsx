'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

import { TravellerForm } from '@/components/travellers/TravellerForm'
import { TravellersList, type Traveller } from '@/components/travellers/TravellersList'
import { Button } from '@/components/ui/button'
import { ROLES, type RoleType } from '@/lib/utils/constants'
import { type TravellerFormData } from '@/lib/utils/validation'

export default function SuperAdminTravellersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [travellers, setTravellers] = useState<Traveller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
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

  // Redirect if not authenticated or not SuperAdmin
  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (!role || role !== ROLES.SUPER_ADMIN) {
      router.push('/auth')
      return
    }
  }, [session, status, router])

  // Load travellers on component mount
  useEffect(() => {
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (role === ROLES.SUPER_ADMIN) {
      void refreshTravellers()
    }
  }, [session])

  const handleAddTraveller = () => {
    setShowAddForm(true)
  }

  const handleEditTraveller = (id: string) => {
    const traveller = travellers.find((t) => t.id === id)
    if (traveller) {
      setEditingTraveller(traveller)
      setShowEditForm(true)
    }
  }

  const handleDeleteTraveller = async (id: string) => {
    if (!confirm('Are you sure you want to delete this traveller? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/travellers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove traveller from local state
        setTravellers((prev) => prev.filter((t) => t.id !== id))
        alert('Traveller deleted successfully!')
      } else {
        const error = (await response.json()) as { error: string }
        alert(`Error deleting traveller: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting traveller:', error)
      alert('Failed to delete traveller. Please try again.')
    } finally {
      setIsLoading(false)
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
          setShowEditForm(false)
          setEditingTraveller(null)
          alert('Traveller updated successfully!')
        } else {
          const error = (await response.json()) as { error: string }
          alert(`Error updating traveller: ${error.error}`)
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
          setShowAddForm(false)
          alert('Traveller created successfully!')
        } else {
          const error = (await response.json()) as { error: string }
          alert(`Error creating traveller: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to save traveller. Please try again.')
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
      } else {
        console.error('Failed to fetch travellers')
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

  if (!session || (session?.user as { role?: RoleType } | undefined)?.role !== ROLES.SUPER_ADMIN) {
    return null
  }

  return (
    <>
      <TravellersList
        travellers={travellers}
        role="SuperAdmin"
        canDelete={true}
        onAddTraveller={handleAddTraveller}
        onEditTraveller={handleEditTraveller}
        onDeleteTraveller={(id) => void handleDeleteTraveller(id)}
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
                  Add New Traveller
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ×
                </Button>
              </div>

              <TravellerForm
                onSubmit={(data) => void handleFormSubmit(data)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Traveller Form Modal */}
      {showEditForm && editingTraveller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[75vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Edit Traveller
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingTraveller(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ×
                </Button>
              </div>

              <TravellerForm
                onSubmit={(data) => void handleFormSubmit(data)}
                onCancel={() => {
                  setShowEditForm(false)
                  setEditingTraveller(null)
                }}
                initialData={editingTraveller}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
