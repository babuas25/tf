'use client'

import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Award,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SimpleDropdown } from '@/components/ui/simple-dropdown'

export interface Traveller {
  id: string
  ptc: string
  givenName: string
  surname: string
  gender: string
  birthdate: string
  nationality: string
  phoneNumber: string
  countryDialingCode: string
  emailAddress: string
  documentType: string
  documentId: string
  documentExpiryDate: string
  ssrCodes: string[]
  ssrRemarks: Record<string, string | undefined>
  loyaltyAirlineCode: string
  loyaltyAccountNumber: string
  createdBy: string
  createdAt: string
  lastModified: string
}

interface TravellersListProps {
  travellers: Traveller[]
  role: string
  canDelete?: boolean
  onAddTraveller: () => void
  onEditTraveller: (id: string) => void
  onDeleteTraveller?: (id: string) => void
  onRefresh: () => void
  isLoading: boolean
  showEditForm?: boolean
  setShowEditForm?: (show: boolean) => void
  editingTraveller?: Traveller | null
  setEditingTraveller?: (traveller: Traveller | null) => void
}

export function TravellersList({
  travellers,
  role,
  canDelete = false,
  onAddTraveller,
  onEditTraveller,
  onDeleteTraveller,
  onRefresh,
  isLoading,
  showEditForm: _showEditForm,
  setShowEditForm: _setShowEditForm,
  editingTraveller: _editingTraveller,
  setEditingTraveller: _setEditingTraveller,
}: TravellersListProps) {
  const [search, setSearch] = useState('')
  const [ptcFilter, setPtcFilter] = useState('All')
  const [nationalityFilter, setNationalityFilter] = useState('All')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredTravellers = travellers.filter((traveller) => {
    const matchesSearch =
      traveller.givenName.toLowerCase().includes(search.toLowerCase()) ||
      traveller.surname.toLowerCase().includes(search.toLowerCase()) ||
      traveller.emailAddress.toLowerCase().includes(search.toLowerCase()) ||
      traveller.documentId.toLowerCase().includes(search.toLowerCase())

    const matchesPtc = ptcFilter === 'All' || traveller.ptc === ptcFilter
    const matchesNationality =
      nationalityFilter === 'All' || traveller.nationality === nationalityFilter

    return matchesSearch && matchesPtc && matchesNationality
  })

  const getRoleDescription = () => {
    switch (role) {
      case 'SuperAdmin':
        return 'Manage all travellers in the system. You can view, add, edit, and delete any traveller.'
      case 'Admin':
        return 'Manage all travellers in the system. You can view, add, and edit any traveller.'
      case 'Staff':
      case 'Agent':
      case 'Partner':
      case 'User':
        return 'Manage your travellers. You can view, add, and edit only the travellers you have created.'
      default:
        return 'Manage travellers.'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Travellers Management
          </h1>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50"
            title="Refresh travellers data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <Button
          onClick={onAddTraveller}
          variant="default"
          className="px-4 py-2 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Traveller
        </Button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">{getRoleDescription()}</p>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name, email, or document ID"
            className="pl-10 h-9 w-full rounded-lg border border-[hsl(var(--primary))]/60 bg-primary/10 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-32">
          <SimpleDropdown
            id="ptc-filter"
            value={ptcFilter}
            options={[
              { value: 'All', label: 'All PTC' },
              { value: 'Adult', label: 'Adult' },
              { value: 'Child', label: 'Child' },
              { value: 'Infant', label: 'Infant' },
            ]}
            onChange={(value) => setPtcFilter(value)}
          />
        </div>
        <div className="w-full sm:w-32">
          <SimpleDropdown
            id="nationality-filter"
            value={nationalityFilter}
            options={[
              { value: 'All', label: 'All Countries' },
              { value: 'BD', label: 'Bangladesh' },
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'UK', label: 'United Kingdom' },
            ]}
            onChange={(value) => setNationalityFilter(value)}
          />
        </div>
      </div>

      {/* Travellers List */}
      <div className="grid gap-4">
        {filteredTravellers.length === 0 ? (
          <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
            <CardContent className="p-8 lg:p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No travellers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search || ptcFilter !== 'All' || nationalityFilter !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first traveller'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTravellers.map((traveller) => (
            <Card
              key={traveller.id}
              className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-colors duration-200 p-4"
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Traveller Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/15 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {traveller.givenName} {traveller.surname}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary border border-[hsl(var(--primary))]/40 px-1 py-0"
                          >
                            {traveller.ptc}
                          </Badge>
                          <span>•</span>
                          <span>{traveller.gender}</span>
                          <span>•</span>
                          <span>{traveller.nationality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-3 w-3 text-primary/80" />
                        <span className="lg:truncate lg:whitespace-nowrap">
                          {traveller.birthdate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="h-3 w-3 text-primary/80" />
                        <span className="lg:truncate lg:whitespace-nowrap">
                          +{traveller.countryDialingCode} {traveller.phoneNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-1 text-gray-600 dark:text-gray-400 leading-none lg:whitespace-nowrap">
                        <Mail className="h-3 w-3 text-primary/80" />
                        <span className="lg:truncate lg:whitespace-nowrap">
                          {traveller.emailAddress}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-1 text-gray-600 dark:text-gray-400 leading-none lg:whitespace-nowrap">
                        <FileText className="h-3 w-3 text-primary/80" />
                        <span className="lg:truncate lg:whitespace-nowrap">
                          {traveller.documentType}: {traveller.documentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-1 text-gray-600 dark:text-gray-400 leading-none lg:whitespace-nowrap">
                        <MapPin className="h-3 w-3 text-primary/80" />
                        <span className="lg:truncate lg:whitespace-nowrap">
                          {traveller.documentExpiryDate}
                        </span>
                      </div>
                      {traveller.loyaltyAirlineCode && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Award className="h-3 w-3" />
                          <span>
                            {traveller.loyaltyAirlineCode} - {traveller.loyaltyAccountNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SSR Codes (hidden on lg for compactness) */}
                    {traveller.ssrCodes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {traveller.ssrCodes.map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {code}
                            {traveller.ssrRemarks[code] && `: ${traveller.ssrRemarks[code]}`}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created by {traveller.createdBy} on {traveller.createdAt}
                      {traveller.lastModified !== traveller.createdAt && (
                        <span> • Last modified: {traveller.lastModified}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTraveller(traveller.id)}
                      className="flex items-center gap-1 border border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10 h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    {canDelete && onDeleteTraveller && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTraveller(traveller.id)}
                        className="flex items-center gap-1 border border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10 h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(traveller.id)}
                      title={expanded[traveller.id] ? 'View less details' : 'View more details'}
                      className="flex items-center gap-1 border border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10 h-8 px-2"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded[traveller.id] ? 'rotate-180' : ''}`}
                      />
                      <span className="text-xs">
                        {expanded[traveller.id] ? 'View Less' : 'View More'}
                      </span>
                    </Button>
                  </div>
                </div>

                {expanded[traveller.id] && (
                  <div className="mt-4 border-t border-white/20 pt-4 space-y-3">
                    {/* Detailed grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="space-y-1 text-gray-700 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Contact</div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary/80" />
                          <span>
                            +{traveller.countryDialingCode} {traveller.phoneNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary/80" />
                          <span>{traveller.emailAddress}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-gray-700 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Identity</div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary/80" />
                          <span>
                            {traveller.documentType}: {traveller.documentId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary/80" />
                          <span>Expires: {traveller.documentExpiryDate}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-gray-700 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Personal</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary/80" />
                          <span>Born: {traveller.birthdate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/80" />
                          <span>Nationality: {traveller.nationality}</span>
                        </div>
                      </div>
                      {traveller.loyaltyAirlineCode && (
                        <div className="space-y-1 text-gray-700 dark:text-gray-300">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Loyalty
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span>
                              {traveller.loyaltyAirlineCode} - {traveller.loyaltyAccountNumber}
                            </span>
                          </div>
                        </div>
                      )}
                      {traveller.ssrCodes.length > 0 && (
                        <div className="space-y-1 text-gray-700 dark:text-gray-300 md:col-span-2 lg:col-span-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">SSR</div>
                          <div className="flex flex-wrap gap-2">
                            {traveller.ssrCodes.map((code) => (
                              <Badge key={code} variant="outline" className="text-xs">
                                {code}
                                {traveller.ssrRemarks[code] && `: ${traveller.ssrRemarks[code]}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created by {traveller.createdBy} on {traveller.createdAt}
                      {traveller.lastModified !== traveller.createdAt && (
                        <span> • Last modified: {traveller.lastModified}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
