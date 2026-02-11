// FareRules API types
// Response structure may vary; these types support common patterns

export interface FareRulesRequest {
  traceId: string
  offerId: string[]
}

export interface FareRulesResponse {
  message: string | null
  requestedOn: string
  respondedOn: string
  response: FareRulesResponseData | null
  statusCode: string
  success: boolean
  error: {
    errorCode: string
    errorMessage: string
  } | null
  info: string | null
}

export interface FareRuleRouteInfo {
  route: string
  fareRulePaxInfos?: {
    paxType: string
    fareBasisCode?: string
    fareRuleInfos?: { category: string; info: string }[]
  }[]
}

export interface FareRulesResponseData {
  traceId?: string
  fareRuleRouteInfos?: FareRuleRouteInfo[]
  fareRuleList?: FareRuleItem[]
  fareRules?: FareRuleItem[] | string[]
  rules?: string[] | FareRuleItem[]
  [key: string]: unknown
}

export interface FareRuleItem {
  ruleText?: string
  text?: string
  ruleCategory?: string
  category?: string
  departure?: string
  arrival?: string
  segmentInfo?: string
  fareBasisCode?: string
  [key: string]: unknown
}

/** Convert HTML entities and <br> to readable text */
function formatFareRuleInfo(html: string): string {
  return html
    .replace(/&mdash;/g, '—')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/** Extract displayable fare rules content from API response */
export function getFareRulesDisplayContent(
  data: FareRulesResponseData | null | undefined
): { items: { title?: string; content: string }[] } {
  if (!data) return { items: [] }

  const items: { title?: string; content: string }[] = []

  // 1. Handle fareRuleRouteInfos (actual BDFare API structure)
  const routeInfos = data.fareRuleRouteInfos
  if (Array.isArray(routeInfos) && routeInfos.length > 0) {
    for (const routeInfo of routeInfos) {
      const routeTitle = routeInfo.route ? `Route: ${routeInfo.route}` : undefined
      const paxInfos = routeInfo.fareRulePaxInfos ?? []
      for (const pax of paxInfos) {
        const paxTitle = pax.paxType ? `${routeTitle ?? ''} (${pax.paxType})` : routeTitle
        const fareBasis = pax.fareBasisCode
        if (fareBasis) {
          items.push({ title: paxTitle ?? 'Fare basis', content: fareBasis })
        }
        const ruleInfos = pax.fareRuleInfos ?? []
        const seen = new Set<string>()
        for (const ri of ruleInfos) {
          const key = `${ri.category}:${ri.info}`
          if (seen.has(key)) continue
          seen.add(key)
          const content = formatFareRuleInfo(ri.info || '')
          if (content) items.push({ title: ri.category, content })
        }
      }
    }
    if (items.length > 0) return { items }
  }

  // 2. Try fareRuleList / fareRules / rules (legacy formats)
  const ruleList =
    data.fareRuleList ?? data.fareRules ?? data.rules ?? ([] as unknown[])

  if (Array.isArray(ruleList)) {
    for (const item of ruleList) {
      if (typeof item === 'string') {
        if (item.trim()) items.push({ content: item.trim() })
        continue
      }
      if (item && typeof item === 'object') {
        const rule = item as FareRuleItem
        const text =
          rule.ruleText ??
          rule.text ??
          (typeof rule.content === 'string' ? rule.content : '')
        const title =
          rule.ruleCategory ?? rule.category ?? rule.segmentInfo ?? undefined
        if (text) items.push(title ? { title, content: String(text) } : { content: String(text) })
        else if (title) items.push({ title, content: '-' })
      }
    }
  }

  // Fallback: stringify any other response content for display
  if (items.length === 0 && data) {
    const keys = Object.keys(data).filter(
      (k) => !['traceId'].includes(k) && data[k] != null
    )
    if (keys.length > 0) {
      try {
        const fallback = JSON.stringify(
          keys.reduce((acc, k) => ({ ...acc, [k]: data[k] }), {}),
          null,
          2
        )
        items.push({ content: fallback })
      } catch {
        items.push({ content: 'Fare rules data received but format is unrecognized.' })
      }
    }
  }

  return { items }
}
