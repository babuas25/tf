import { relations } from 'drizzle-orm'
import { pgTable, timestamp, uuid, jsonb, varchar, date } from 'drizzle-orm/pg-core'

// Travellers table
export const travellers = pgTable('travellers', {
  id: uuid('id').defaultRandom().primaryKey(),
  ptc: varchar('ptc', { length: 10 }).default('Adult'), // Adult, Child, Infant
  givenName: varchar('given_name', { length: 100 }).notNull(),
  surname: varchar('surname', { length: 100 }).notNull(),
  gender: varchar('gender', { length: 10 }).default('Other'), // Male, Female, Other
  birthdate: date('birthdate'), // Optional
  nationality: varchar('nationality', { length: 3 }), // Country code (BD, US, etc.) - Optional

  // Contact Information
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  countryDialingCode: varchar('country_dialing_code', { length: 5 }), // Optional
  emailAddress: varchar('email_address', { length: 255 }), // Optional

  // Identity Document
  documentType: varchar('document_type', { length: 50 }), // Passport, National ID, etc. - Optional
  documentId: varchar('document_id', { length: 100 }), // Optional
  documentExpiryDate: date('document_expiry_date'), // Optional

  // Special Service Requests (SSR)
  ssrCodes: jsonb('ssr_codes').$type<string[]>().default([]),
  ssrRemarks: jsonb('ssr_remarks').$type<Record<string, string>>().default({}),

  // Loyalty Program
  loyaltyAirlineCode: varchar('loyalty_airline_code', { length: 10 }),
  loyaltyAccountNumber: varchar('loyalty_account_number', { length: 50 }),

  // Metadata
  createdBy: varchar('created_by', { length: 50 }).notNull(), // User role who created
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(), // User ID who created
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const travellersRelations = relations(travellers, ({ one: _one }) => ({
  // Add relations here if needed (e.g., to users table)
}))

// Export types
export type Traveller = typeof travellers.$inferSelect
export type NewTraveller = typeof travellers.$inferInsert
