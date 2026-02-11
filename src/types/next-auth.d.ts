declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
      isActive: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    role: string
    isActive?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isActive?: boolean
    statusCheckedAt?: number
  }
}
