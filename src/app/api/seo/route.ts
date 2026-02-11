import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string
      description?: string
      keywords?: string
    }

    const res = NextResponse.json({ ok: true })

    // Helper to clamp value length to avoid exceeding cookie limits
    const clamp = (val: string, max = 1800) => (val.length > max ? val.slice(0, max) : val)

    // Set cookies only for provided fields
    if (typeof body.title === 'string') {
      res.cookies.set('seo_title', clamp(body.title.trim()), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    if (typeof body.description === 'string') {
      res.cookies.set('seo_description', clamp(body.description.trim()), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    if (typeof body.keywords === 'string') {
      // normalize comma separated list
      const normalized = body.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .join(', ')
      res.cookies.set('seo_keywords', clamp(normalized), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }

    return res
  } catch (_e) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}
