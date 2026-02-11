import { z } from 'zod'

// Registration form validation schema
export const registrationSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character',
      ),
    confirmPassword: z.string(),
    gender: z.enum(['Male', 'Female', 'Other']),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const birthDate = new Date(data.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 18
    },
    {
      message: 'You must be at least 18 years old',
      path: ['dateOfBirth'],
    },
  )

// Sign in form validation schema
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
})

// Role assignment schema
export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['SuperAdmin', 'Admin', 'Staff', 'Partner', 'Agent', 'User']),
  subRole: z.string().optional(),
})

// Traveller form validation schema
export const travellerFormSchema = z.object({
  ptc: z.enum(['Adult', 'Child', 'Infant']).optional(),
  givenName: z
    .string()
    .min(2, 'Given name must be at least 2 characters')
    .max(50, 'Given name must be less than 50 characters'),
  surname: z
    .string()
    .min(2, 'Surname must be at least 2 characters')
    .max(50, 'Surname must be less than 50 characters'),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  birthdate: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true // Optional field
      const birthDate = new Date(date)
      const today = new Date()
      return birthDate <= today
    }, 'Birthdate cannot be in the future'),
  nationality: z.string().optional(),
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  countryDialingCode: z.string().optional(),
  emailAddress: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  documentType: z.enum(['Passport', 'National ID', 'Driver License', 'Other']).optional(),
  documentId: z.string().optional(),
  documentExpiryDate: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true // Optional field
      const expiryDate = new Date(date)
      const today = new Date()
      return expiryDate > today
    }, 'Document must not be expired'),
  ssrCodes: z
    .array(
      z.object({
        code: z.string().min(1, 'SSR code is required'),
        remark: z.string().optional(),
      }),
    )
    .optional(),
  loyaltyAirlineCode: z.string().optional(),
  loyaltyAccountNumber: z.string().optional(),
})

// User profile edit schema
export const userProfileEditSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  mobile: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),
  avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
})

export type RegistrationFormData = z.infer<typeof registrationSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type RoleAssignmentData = z.infer<typeof roleAssignmentSchema>
export type TravellerFormData = z.infer<typeof travellerFormSchema>
export type UserProfileEditData = z.infer<typeof userProfileEditSchema>
