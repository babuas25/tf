import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import { serverEnv } from '@/lib/env.server'

import * as schema from './schema'

// Get connection string from validated environment variables
const connectionString = serverEnv.DATABASE_URL

// Create Neon client
const sql = neon(connectionString)

// Create Drizzle database instance
export const db = drizzle(sql, { schema })

// Export schema for use in other files
export * from './schema'
