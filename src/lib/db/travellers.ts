import { eq, and, like, or, desc } from 'drizzle-orm'

import { db, travellers, type Traveller, type NewTraveller } from './index'

// Get all travellers (with role-based filtering)
export async function getTravellers(userRole: string, userId: string) {
  const query = db.select().from(travellers)

  // Apply role-based filtering
  if (userRole === 'SuperAdmin') {
    // SuperAdmin can see all travellers
    return await query.orderBy(desc(travellers.createdAt))
  } else if (userRole === 'Admin') {
    // Admin can see all travellers
    return await query.orderBy(desc(travellers.createdAt))
  } else {
    // Staff, Agent, Partner, User can only see their own travellers
    return await query
      .where(eq(travellers.createdByUserId, userId))
      .orderBy(desc(travellers.createdAt))
  }
}

// Get traveller by ID (with role-based access control)
export async function getTravellerById(id: string, userRole: string, userId: string) {
  // Apply role-based filtering
  if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
    const result = await db
      .select()
      .from(travellers)
      .where(and(eq(travellers.id, id), eq(travellers.createdByUserId, userId)))
    return result[0] || null
  } else {
    const result = await db.select().from(travellers).where(eq(travellers.id, id))
    return result[0] || null
  }
}

// Search travellers (with role-based filtering)
export async function searchTravellers(
  searchTerm: string,
  userRole: string,
  userId: string,
  filters?: {
    ptc?: string
    nationality?: string
  },
) {
  // Apply role-based filtering
  if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
    const conditions = [eq(travellers.createdByUserId, userId)]

    if (searchTerm) {
      conditions.push(
        or(
          like(travellers.givenName, `%${searchTerm}%`),
          like(travellers.surname, `%${searchTerm}%`),
          like(travellers.emailAddress, `%${searchTerm}%`),
          like(travellers.documentId, `%${searchTerm}%`),
        )!,
      )
    }

    if (filters?.ptc && filters.ptc !== 'All') {
      conditions.push(eq(travellers.ptc, filters.ptc))
    }

    if (filters?.nationality && filters.nationality !== 'All') {
      conditions.push(eq(travellers.nationality, filters.nationality))
    }

    return await db
      .select()
      .from(travellers)
      .where(and(...conditions))
      .orderBy(desc(travellers.createdAt))
  } else {
    const conditions = []

    if (searchTerm) {
      conditions.push(
        or(
          like(travellers.givenName, `%${searchTerm}%`),
          like(travellers.surname, `%${searchTerm}%`),
          like(travellers.emailAddress, `%${searchTerm}%`),
          like(travellers.documentId, `%${searchTerm}%`),
        )!,
      )
    }

    if (filters?.ptc && filters.ptc !== 'All') {
      conditions.push(eq(travellers.ptc, filters.ptc))
    }

    if (filters?.nationality && filters.nationality !== 'All') {
      conditions.push(eq(travellers.nationality, filters.nationality))
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(travellers)
        .where(and(...conditions))
        .orderBy(desc(travellers.createdAt))
    } else {
      return await db.select().from(travellers).orderBy(desc(travellers.createdAt))
    }
  }
}

// Paged travellers with DB-side pagination and proper total count
export async function getTravellersPaged(
  userRole: string,
  userId: string,
  params: {
    search?: string
    filters?: { ptc?: string; nationality?: string }
    page: number
    limit: number
  },
): Promise<{ rows: Traveller[]; total: number }> {
  const { search, filters, page, limit } = params
  const offset = Math.max(0, (page - 1) * limit)

  type WhereExpr = Parameters<typeof and>[number]
  const baseConditions: WhereExpr[] = []
  if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
    baseConditions.push(eq(travellers.createdByUserId, userId))
  }

  if (search) {
    baseConditions.push(
      or(
        like(travellers.givenName, `%${search}%`),
        like(travellers.surname, `%${search}%`),
        like(travellers.emailAddress, `%${search}%`),
        like(travellers.documentId, `%${search}%`),
      ),
    )
  }

  if (filters?.ptc && filters.ptc !== 'All') {
    baseConditions.push(eq(travellers.ptc, filters.ptc))
  }
  if (filters?.nationality && filters.nationality !== 'All') {
    baseConditions.push(eq(travellers.nationality, filters.nationality))
  }

  const whereClause = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const rows = whereClause
    ? await db
        .select()
        .from(travellers)
        .where(whereClause)
        .orderBy(desc(travellers.createdAt))
        .limit(limit)
        .offset(offset)
    : await db
        .select()
        .from(travellers)
        .orderBy(desc(travellers.createdAt))
        .limit(limit)
        .offset(offset)

  const totalRes = whereClause
    ? await db.select({ value: travellers.id }).from(travellers).where(whereClause)
    : await db.select({ value: travellers.id }).from(travellers)

  const total = totalRes.length
  return { rows, total }
}

// Create new traveller
export async function createTraveller(data: Omit<NewTraveller, 'id' | 'createdAt' | 'updatedAt'>) {
  const [traveller] = await db
    .insert(travellers)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  return traveller
}

// Update traveller (with role-based access control)
export async function updateTraveller(
  id: string,
  data: Partial<Omit<NewTraveller, 'id' | 'createdAt' | 'createdBy' | 'createdByUserId'>>,
  userRole: string,
  userId: string,
) {
  let whereCondition

  // Apply role-based filtering for update
  if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
    whereCondition = and(eq(travellers.id, id), eq(travellers.createdByUserId, userId))
  } else {
    whereCondition = eq(travellers.id, id)
  }

  const [traveller] = await db
    .update(travellers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(whereCondition)
    .returning()

  return traveller || null
}

// Delete traveller (only SuperAdmin can delete)
export async function deleteTraveller(id: string, userRole: string, _userId: string) {
  if (userRole !== 'SuperAdmin') {
    throw new Error('Only SuperAdmin can delete travellers')
  }

  const [traveller] = await db.delete(travellers).where(eq(travellers.id, id)).returning()

  return traveller || null
}

// Get travellers count (for statistics)
export async function getTravellersCount(userRole: string, userId: string) {
  // Apply role-based filtering
  if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
    const result = await db
      .select({ count: travellers.id })
      .from(travellers)
      .where(eq(travellers.createdByUserId, userId))
    return result.length
  } else {
    const result = await db.select({ count: travellers.id }).from(travellers)
    return result.length
  }
}
