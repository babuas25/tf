import { NextRequest, NextResponse } from 'next/server'
import { z, ZodTypeAny, ZodType } from 'zod'

export type ValidatedQuery<T extends ZodTypeAny> = z.infer<T>
export type ValidatedBody<T extends ZodTypeAny> = z.infer<T>
export type ValidatedParams<T extends ZodTypeAny> = z.infer<T>

export function validateQuery<Out, S extends ZodType<Out>>(req: NextRequest, schema: S): Out {
  const { searchParams } = new URL(req.url)
  const entries = Object.fromEntries(searchParams.entries()) as Record<string, string>
  const parsed = schema.safeParse(entries)
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten()))
  }
  return parsed.data
}

export async function validateJson<Out, S extends ZodType<Out>>(
  req: Request,
  schema: S,
): Promise<Out> {
  const body: unknown = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten()))
  }
  return parsed.data
}

export function validateParams<Out, S extends ZodType<Out>>(raw: unknown, schema: S): Out {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten()))
  }
  return parsed.data
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: 'Invalid request',
      message,
      ...(details ? { details } : {}),
    },
    { status: 400 },
  )
}
