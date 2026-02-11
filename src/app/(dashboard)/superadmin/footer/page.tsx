'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { DynamicButton } from '@/components/ui/dynamic-theme-components'
import { ROLES, type RoleType } from '@/lib/utils/constants'

const schema = z.object({
  social: z
    .object({
      facebook: z.string().url().nullable().optional(),
      instagram: z.string().url().nullable().optional(),
      community: z.string().url().nullable().optional(),
    })
    .partial()
    .optional(),
  privacyContent: z.string().nullable().optional(),
  termsContent: z.string().nullable().optional(),
})

type FooterSettings = z.infer<typeof schema>

// Deep merge helper to preserve existing footer fields
function mergeFooterSettings(
  existing: FooterSettings | null | undefined,
  partial: Partial<FooterSettings>,
): FooterSettings {
  const base = existing ?? {}
  const next: FooterSettings = { ...base, ...partial }
  if (base.social || partial.social) {
    next.social = { ...(base.social ?? {}), ...(partial.social ?? {}) }
  }
  return next
}

export default function SuperadminFooterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<z.infer<typeof schema>>({
    social: { facebook: '', instagram: '', community: '' },
    privacyContent: '',
    termsContent: '',
  })

  useEffect(() => {
    if (status === 'loading') return
    const role = (session?.user as { role?: RoleType } | undefined)?.role
    if (!role || role !== ROLES.SUPER_ADMIN) {
      router.replace('/')
      return
    }
    try {
      const raw = localStorage.getItem('tripfeels-footer-settings')
      if (raw) {
        const parsed = JSON.parse(raw) as FooterSettings
        setForm({
          social: {
            facebook: parsed?.social?.facebook ?? '',
            instagram: parsed?.social?.instagram ?? '',
            community: parsed?.social?.community ?? '',
          },
          privacyContent: parsed?.privacyContent ?? '',
          termsContent: parsed?.termsContent ?? '',
        })
      }
    } catch (e) {
      console.error('footer load error', e)
    } finally {
      setLoading(false)
    }
  }, [session, status, router])

  const disabled = useMemo(() => saving || loading, [saving, loading])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = schema.parse({
        social: {
          facebook: form.social?.facebook || null,
          instagram: form.social?.instagram || null,
          community: form.social?.community || null,
        },
        privacyContent: form.privacyContent ?? null,
        termsContent: form.termsContent ?? null,
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onSaveFacebookOnly = () => {
    setSaving(true)
    try {
      const payload = schema.parse({
        social: { facebook: form.social?.facebook || null },
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onSaveInstagramOnly = () => {
    setSaving(true)
    try {
      const payload = schema.parse({
        social: { instagram: form.social?.instagram || null },
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onSaveCommunityOnly = () => {
    setSaving(true)
    try {
      const payload = schema.parse({
        social: { community: form.social?.community || null },
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onSavePrivacyOnly = () => {
    setSaving(true)
    try {
      const payload = schema.parse({
        privacyContent: form.privacyContent ?? null,
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onSaveTermsOnly = () => {
    setSaving(true)
    try {
      const payload = schema.parse({
        termsContent: form.termsContent ?? null,
      })
      const prevRaw = localStorage.getItem('tripfeels-footer-settings')
      const prev: FooterSettings = prevRaw ? (JSON.parse(prevRaw) as FooterSettings) : {}
      const merged = mergeFooterSettings(prev, payload)
      localStorage.setItem('tripfeels-footer-settings', JSON.stringify(merged))
    } catch (e) {
      console.error(e)
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Footer</h1>

      <form
        onSubmit={(e) => {
          void onSubmit(e)
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Links</h2>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Facebook URL
              </label>
              <input
                type="url"
                value={form.social?.facebook ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, social: { ...f.social, facebook: e.target.value } }))
                }
                className="glass-input w-full"
                placeholder="https://facebook.com/yourpage"
              />
              <div className="mt-2">
                <DynamicButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onSaveFacebookOnly()}
                >
                  {saving ? 'Saving...' : 'Save Facebook only'}
                </DynamicButton>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Instagram URL
              </label>
              <input
                type="url"
                value={form.social?.instagram ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, social: { ...f.social, instagram: e.target.value } }))
                }
                className="glass-input w-full"
                placeholder="https://instagram.com/yourpage"
              />
              <div className="mt-2">
                <DynamicButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onSaveInstagramOnly()}
                >
                  {saving ? 'Saving...' : 'Save Instagram only'}
                </DynamicButton>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Community URL
              </label>
              <input
                type="url"
                value={form.social?.community ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, social: { ...f.social, community: e.target.value } }))
                }
                className="glass-input w-full"
                placeholder="https://discord.gg/yourinvite"
              />
              <div className="mt-2">
                <DynamicButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onSaveCommunityOnly()}
                >
                  {saving ? 'Saving...' : 'Save Community only'}
                </DynamicButton>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Legal Content
            </h2>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Privacy Policy
              </label>
              <textarea
                value={form.privacyContent ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, privacyContent: e.target.value }))}
                className="glass-input w-full min-h-[160px]"
                placeholder="Write your Privacy Policy content here"
              />
              <div className="mt-2">
                <DynamicButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onSavePrivacyOnly()}
                >
                  {saving ? 'Saving...' : 'Save Privacy only'}
                </DynamicButton>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                Terms & Conditions
              </label>
              <textarea
                value={form.termsContent ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, termsContent: e.target.value }))}
                className="glass-input w-full min-h-[160px]"
                placeholder="Write your Terms & Conditions content here"
              />
              <div className="mt-2">
                <DynamicButton
                  type="button"
                  variant="secondary"
                  disabled={disabled}
                  onClick={() => void onSaveTermsOnly()}
                >
                  {saving ? 'Saving...' : 'Save Terms only'}
                </DynamicButton>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <DynamicButton type="submit" disabled={disabled} variant="primary" className="px-4">
            {saving ? 'Saving...' : 'Save'}
          </DynamicButton>
        </div>
      </form>
    </div>
  )
}
