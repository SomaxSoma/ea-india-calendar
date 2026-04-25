import { supabase } from '../../../lib/supabase'

const LUMA_URLS = [
  'https://luma.com/user/portal',
  'https://luma.com/user/vyakart',
  'https://luma.com/bluedotevents',
  'https://luma.com/user/electricsheep',
  'https://luma.com/iaae',
  'https://luma.com/user/eaindiatalks',
]

const NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/

const INDIA_CITIES = [
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
  'hyderabad', 'chennai', 'pune', 'kolkata', 'ahmedabad',
  'goa', 'jaipur', 'kochi', 'lucknow', 'chandigarh',
]

function isVirtual(locType) {
  const t = (locType || '').toLowerCase()
  return t.includes('online') || t.includes('zoom') || t.includes('virtual') || t.includes('remote')
}

function passesIndiaOrOnlineFilter(item) {
  const event = item.event ?? {}
  if (isVirtual(event.location_type)) return true

  const g = event.geo_address_info ?? {}
  const haystack = [
    g.full_address, g.address, g.city, g.region, g.country, g.city_state,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!haystack) return false
  return INDIA_CITIES.some((city) => haystack.includes(city))
}

function extractNextData(html) {
  const match = html.match(NEXT_DATA_RE)
  if (!match) return null
  return JSON.parse(match[1])
}

function buildLocation(item) {
  const event = item.event ?? {}
  const locType = (event.location_type || '').toLowerCase()
  const out = []

  if (locType === 'offline' && event.geo_address_info) {
    const g = event.geo_address_info
    const physical =
      g.full_address ||
      g.address ||
      [g.city, g.region, g.country].filter(Boolean).join(', ') ||
      g.city_state ||
      g.city ||
      null
    if (physical) out.push(physical)
  }

  if (locType.includes('zoom') || locType.includes('online')) {
    out.push('Online')
  }

  return out
}

function transformItem(item) {
  const event = item.event ?? {}
  const calendar = item.calendar ?? {}
  return {
    source: 'luma',
    source_id: event.api_id,
    title: event.name,
    description: `Via ${calendar.name ?? 'Luma'} on Luma`,
    link: `https://luma.com/${event.url}`,
    start_date: event.start_at,
    end_date: event.end_at ?? null,
    location: buildLocation(item),
    type: 'meetup',
    status: 'approved',
    registration_close: null,
    updated_at: new Date().toISOString(),
  }
}

async function fetchCalendar(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; EAIndiaCalendarBot/1.0; +https://github.com/SomaxSoma/ea-india-calendar)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const html = await res.text()
  const nextData = extractNextData(html)
  if (!nextData) throw new Error(`__NEXT_DATA__ not found for ${url}`)

  const items = nextData?.props?.pageProps?.initialData?.data?.featured_items
  if (!Array.isArray(items)) {
    throw new Error(`featured_items missing for ${url}`)
  }
  return items
}

export async function GET() {
  const allEvents = []
  const errors = []

  for (const url of LUMA_URLS) {
    try {
      const items = await fetchCalendar(url)
      for (const item of items) {
        if (!item?.event?.api_id) continue
        if (!passesIndiaOrOnlineFilter(item)) continue
        allEvents.push(transformItem(item))
      }
    } catch (err) {
      console.error(`[fetch-luma] ${url}:`, err.message)
      errors.push({ url, error: err.message })
    }
  }

  if (allEvents.length === 0) {
    return Response.json(
      { success: false, count: 0, errors },
      { status: errors.length ? 502 : 200 }
    )
  }

  const { error } = await supabase
    .from('events')
    .upsert(allEvents, { onConflict: 'source,source_id' })

  if (error) {
    return Response.json(
      { success: false, error: error.message, errors },
      { status: 500 }
    )
  }

  return Response.json({ success: true, count: allEvents.length, errors })
}
