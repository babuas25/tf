import { z, ZodError } from 'zod'

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  FACEBOOK_CLIENT_ID: z.string().min(1, 'FACEBOOK_CLIENT_ID is required'),
  FACEBOOK_CLIENT_SECRET: z.string().min(1, 'FACEBOOK_CLIENT_SECRET is required'),
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email({ message: 'FIREBASE_CLIENT_EMAIL must be a valid email' }),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
})

function formatZodError(err: unknown) {
  if (err instanceof ZodError) {
    return err.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')
  }
  return String(err)
}

const rawServer = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
}

let server: z.infer<typeof ServerEnvSchema>
try {
  server = ServerEnvSchema.parse(rawServer)
} catch (e) {
  const details = formatZodError(e)
  throw new Error(`Invalid server environment variables:\n${details}`)
}

export const serverEnv = {
  ...server,
  FIREBASE_PRIVATE_KEY: server.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}
