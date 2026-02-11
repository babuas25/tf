import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'

import { getSuperAdminEmails } from '@/lib/utils/constants'

import { db } from './config'

// User document interface
export interface UserDocument {
  uid: string
  email: string
  role: RoleType
  category?: string
  profile: {
    firstName: string
    lastName: string
    gender: 'Male' | 'Female' | 'Other'
    dateOfBirth: string
    mobile: string
    avatar?: string
  }
  metadata: {
    createdAt: Timestamp
    lastLoginAt: Timestamp
    isActive: boolean
    emailVerified: boolean
  }
  permissions?: string[]
  assignedBy?: string
}

export type RoleType = 'SuperAdmin' | 'Admin' | 'Staff' | 'Partner' | 'Agent' | 'User'

export type SubRoleType = {
  Staff: 'Accounts' | 'Support' | 'Key Manager' | 'Research' | 'Media' | 'Sales'
  Partner: 'Supplier' | 'Service Provider'
  Agent: 'Distributor' | 'Franchise' | 'B2B'
}

// User operations
export const createUser = async (userData: Partial<UserDocument>) => {
  if (!userData.uid) throw new Error('User ID is required')

  const userRef = doc(db, 'users', userData.uid)
  const now = Timestamp.now()

  const userDoc = {
    uid: userData.uid,
    email: userData.email || '',
    role: userData.role || 'User',
    category: userData.category || '',
    profile: {
      firstName: userData.profile?.firstName || '',
      lastName: userData.profile?.lastName || '',
      gender: userData.profile?.gender || 'Other',
      dateOfBirth: userData.profile?.dateOfBirth || '',
      mobile: userData.profile?.mobile || '',
      avatar: userData.profile?.avatar || '',
    },
    metadata: {
      createdAt: now,
      lastLoginAt: now,
      isActive: true,
      emailVerified: false,
    },
    permissions: userData.permissions || [],
    assignedBy: userData.assignedBy || '',
  }

  await setDoc(userRef, userDoc)

  return userRef
}

export const getUser = async (uid: string): Promise<UserDocument | null> => {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument
  }

  return null
}

export const updateUser = async (uid: string, updates: Partial<UserDocument>) => {
  const userRef = doc(db, 'users', uid)

  // Handle nested field updates properly
  const updateData: Record<string, unknown> = {}

  Object.keys(updates).forEach((key) => {
    if (key === 'metadata' && updates.metadata) {
      // Handle metadata updates
      Object.keys(updates.metadata).forEach((metaKey) => {
        updateData[`metadata.${metaKey}`] =
          updates.metadata![metaKey as keyof typeof updates.metadata]
      })
    } else if (key === 'profile' && updates.profile) {
      // Handle profile updates
      Object.keys(updates.profile).forEach((profileKey) => {
        updateData[`profile.${profileKey}`] =
          updates.profile![profileKey as keyof typeof updates.profile]
      })
    } else if (key !== 'metadata' && key !== 'profile') {
      // Handle direct field updates
      updateData[key] = updates[key as keyof UserDocument]
    }
  })

  await updateDoc(userRef, updateData)
  return userRef
}

export const updateUserRole = async (uid: string, role: RoleType, assignedBy: string) => {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    role,
    assignedBy,
    'metadata.lastLoginAt': Timestamp.now(),
  })
  return userRef
}

export const getUsersByRole = async (role: RoleType) => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('role', '==', role))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => doc.data() as UserDocument)
}

export const getAllUsers = async (limitCount = 50) => {
  const usersRef = collection(db, 'users')
  try {
    const q = query(usersRef, orderBy('metadata.createdAt', 'desc'), limit(limitCount))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => doc.data() as UserDocument)
  } catch (_err) {
    // Fallback if orderBy on nested field is not indexed or missing in some docs
    const fallbackSnapshot = await getDocs(query(usersRef, limit(limitCount)))
    return fallbackSnapshot.docs.map((doc) => doc.data() as UserDocument)
  }
}

export const isSuperAdminEmail = (email: string): boolean => {
  const superAdminEmails = getSuperAdminEmails()
  return superAdminEmails.includes(email.toLowerCase())
}

// Export getSuperAdminEmails function for use in other modules
export { getSuperAdminEmails } from '@/lib/utils/constants'
