'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleDropdown } from '@/components/ui/simple-dropdown'
import { travellerFormSchema, type TravellerFormData } from '@/lib/utils/validation'

import { type Traveller } from './TravellersList'

// TravellerFormData is now imported from validation.ts

interface TravellerFormProps {
  onSubmit: (data: TravellerFormData) => void
  onCancel: () => void
  initialData?: Traveller | null
  isEditing?: boolean
}

const PTC_OPTIONS = [
  { value: 'Adult', label: 'Adult' },
  { value: 'Child', label: 'Child' },
  { value: 'Infant', label: 'Infant' },
]

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const NATIONALITY_OPTIONS = [
  { value: 'BD', label: 'Bangladesh' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
  { value: 'CN', label: 'China' },
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'Passport', label: 'Passport' },
  { value: 'National ID', label: 'National ID' },
  { value: 'Driver License', label: 'Driver License' },
  { value: 'Other', label: 'Other' },
]

const COUNTRY_DIALING_CODES = [
  { value: '880', label: '+880 (Bangladesh)' },
  { value: '1', label: '+1 (US/Canada)' },
  { value: '44', label: '+44 (UK)' },
  { value: '61', label: '+61 (Australia)' },
  { value: '49', label: '+49 (Germany)' },
  { value: '33', label: '+33 (France)' },
  { value: '81', label: '+81 (Japan)' },
  { value: '91', label: '+91 (India)' },
  { value: '86', label: '+86 (China)' },
]

const SSR_CODE_OPTIONS = [
  { value: 'WCHR', label: 'WCHR - Wheelchair' },
  { value: 'VVIP', label: 'VVIP - Very Very Important Person' },
  { value: 'MAAS', label: 'MAAS - Meet and Assist' },
  { value: 'FQTV', label: 'FQTV - Frequent Traveler' },
  { value: 'BLND', label: 'BLND - Blind Passenger' },
  { value: 'DEAF', label: 'DEAF - Deaf Passenger' },
  { value: 'DPNA', label: 'DPNA - Disabled Passenger' },
  { value: 'MEDA', label: 'MEDA - Medical Assistance' },
]

const AIRLINE_CODES = [
  { value: 'BG', label: 'BG - Biman Bangladesh' },
  { value: 'AA', label: 'AA - American Airlines' },
  { value: 'DL', label: 'DL - Delta Air Lines' },
  { value: 'UA', label: 'UA - United Airlines' },
  { value: 'BA', label: 'BA - British Airways' },
  { value: 'AC', label: 'AC - Air Canada' },
  { value: 'VA', label: 'VA - Virgin Australia' },
  { value: 'LH', label: 'LH - Lufthansa' },
  { value: 'AF', label: 'AF - Air France' },
  { value: 'JL', label: 'JL - Japan Airlines' },
]

export function TravellerForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: TravellerFormProps) {
  const [newSSRCode, setNewSSRCode] = useState('')
  const [newSSRRemark, setNewSSRRemark] = useState('')

  const form = useForm<TravellerFormData>({
    resolver: zodResolver(travellerFormSchema),
    defaultValues: {
      ptc:
        initialData?.ptc && ['Adult', 'Child', 'Infant'].includes(initialData.ptc)
          ? (initialData.ptc as 'Adult' | 'Child' | 'Infant')
          : 'Adult',
      givenName: initialData?.givenName || '',
      surname: initialData?.surname || '',
      gender:
        initialData?.gender && ['Male', 'Female', 'Other'].includes(initialData.gender)
          ? (initialData.gender as 'Male' | 'Female' | 'Other')
          : 'Male',
      birthdate: initialData?.birthdate || '',
      nationality: initialData?.nationality || 'BD',
      phoneNumber: initialData?.phoneNumber || '',
      countryDialingCode: initialData?.countryDialingCode || '880',
      emailAddress: initialData?.emailAddress || '',
      documentType:
        initialData?.documentType &&
        ['Passport', 'National ID', 'Driver License', 'Other'].includes(initialData.documentType)
          ? (initialData.documentType as 'Passport' | 'National ID' | 'Driver License' | 'Other')
          : 'Passport',
      documentId: initialData?.documentId || '',
      documentExpiryDate: initialData?.documentExpiryDate || '',
      ssrCodes: initialData?.ssrCodes
        ? initialData.ssrCodes.map((code) => ({
            code,
            remark: initialData.ssrRemarks?.[code] || '',
          }))
        : [],
      loyaltyAirlineCode: initialData?.loyaltyAirlineCode || '',
      loyaltyAccountNumber: initialData?.loyaltyAccountNumber || '',
    },
  })

  const handleAddSSRCode = () => {
    const currentSSRCodes = form.getValues('ssrCodes') || []
    if (newSSRCode && !currentSSRCodes.find((ssr) => ssr.code === newSSRCode)) {
      form.setValue('ssrCodes', [...currentSSRCodes, { code: newSSRCode, remark: newSSRRemark }])
      setNewSSRCode('')
      setNewSSRRemark('')
    }
  }

  const handleRemoveSSRCode = (code: string) => {
    const currentSSRCodes = form.getValues('ssrCodes') || []
    form.setValue(
      'ssrCodes',
      currentSSRCodes.filter((ssr) => ssr.code !== code),
    )
  }

  const handleSubmit = (data: TravellerFormData) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(handleSubmit)(e)
        }}
        className="space-y-6"
      >
        {/* Personal Information */}
        <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="ptc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">PTC</FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="ptc"
                        value={field.value || 'Adult'}
                        options={PTC_OPTIONS}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="givenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Given Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Surname</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Gender</FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="gender"
                        value={field.value || 'Male'}
                        options={GENDER_OPTIONS}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Birthdate</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Nationality</FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="nationality"
                        value={field.value || 'BD'}
                        options={NATIONALITY_OPTIONS}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="countryDialingCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">
                      Country Dialing Code
                    </FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="countryDialingCode"
                        value={field.value || '880'}
                        options={COUNTRY_DIALING_CODES}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                        placeholder="1234567890"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-gray-900 dark:text-gray-100">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                        placeholder="example@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Identity Document */}
        <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Identity Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Type</FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="documentType"
                        value={field.value || 'Passport'}
                        options={DOCUMENT_TYPE_OPTIONS}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                        placeholder="BH345678"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Special Service Requests (SSR) */}
        <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Special Service Requests (SSR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Existing SSR Codes */}
            {form.watch('ssrCodes') && form.watch('ssrCodes')!.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Current SSR Codes</Label>
                <div className="flex flex-wrap gap-2">
                  {form.watch('ssrCodes')!.map((ssr) => (
                    <Badge key={ssr.code} variant="outline" className="flex items-center gap-1">
                      {ssr.code}
                      {ssr.remark && `: ${ssr.remark}`}
                      <button
                        type="button"
                        onClick={() => handleRemoveSSRCode(ssr.code)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Add New SSR Code */}
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-gray-100">Add SSR Code</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-2">
                  <SimpleDropdown
                    id="newSSRCode"
                    value={newSSRCode}
                    options={SSR_CODE_OPTIONS}
                    onChange={(value) => setNewSSRCode(value)}
                    placeholder="Select SSR Code"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={newSSRRemark}
                    onChange={(e) => setNewSSRRemark(e.target.value)}
                    className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                    placeholder="Remark (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={handleAddSSRCode}
                    disabled={!newSSRCode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add SSR
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program */}
        <Card className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Loyalty Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="loyaltyAirlineCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">Airline Code</FormLabel>
                    <FormControl>
                      <SimpleDropdown
                        id="loyaltyAirlineCode"
                        value={field.value || ''}
                        options={AIRLINE_CODES}
                        onChange={field.onChange}
                        placeholder="Select Airline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loyaltyAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-900 dark:text-gray-100">
                      Loyalty Account Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100"
                        placeholder="1234567"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEditing ? 'Update Traveller' : 'Add Traveller'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
