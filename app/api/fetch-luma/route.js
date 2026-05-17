import { supabase } from '../../../lib/supabase'

// Supports two URL shapes:
//   - calendar pages: https://luma.com/<calendar-slug>  (e.g. bluedotevents, iaae)
//   - individual event pages: https://luma.com/<event-slug>  (e.g. sd2iu7kc)
// User-profile URLs (luma.com/user/<slug>) do not expose an event listing in
// their HTML; they will fetch but yield zero events. Replace them with the
// host's calendar page or specific event URLs.
const LUMA_URLS = [
  'https://luma.com/user/portal',
  'https://luma.com/user/vyakart',
  'https://luma.com/bluedotevents',
  'https://luma.com/user/electricsheep',
  'https://luma.com/iaae',
  'https://luma.com/user/eaindiatalks',
  'https://luma.com/sd2iu7kc',
]

const NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/

const INDIA_CITIES = [
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
  'hyderabad', 'chennai', 'pune', 'kolkata', 'ahmedabad',
  'goa', 'jaipur', 'kochi', 'lucknow', 'chandigarh',
]

// Non-India places we screen out of online-event titles. Online organizers
// usually omit "India" to stay inclusive, but a title that names a *different*
// country/city is almost always region-specific to that place.
const NON_INDIA_PLACES = [
  // countries
  'canada', 'usa', 'u.s.a.', 'u.s.', 'america', 'american',
  'uk', 'u.k.', 'britain', 'british', 'england', 'scotland', 'wales',
  'united states', 'united kingdom',
  'australia', 'australian', 'new zealand',
  'germany', 'german', 'france', 'french', 'spain', 'spanish',
  'italy', 'italian', 'netherlands', 'dutch', 'belgium', 'belgian',
  'switzerland', 'swiss', 'austria', 'austrian', 'ireland', 'irish',
  'portugal', 'portuguese', 'sweden', 'swedish', 'norway', 'norwegian',
  'denmark', 'danish', 'finland', 'finnish', 'poland', 'polish',
  'czech', 'hungary', 'hungarian', 'greece', 'greek',
  'russia', 'russian', 'ukraine', 'ukrainian',
  'china', 'chinese', 'japan', 'japanese', 'korea', 'korean',
  'taiwan', 'taiwanese', 'singapore', 'singaporean',
  'philippines', 'filipino', 'indonesia', 'indonesian',
  'thailand', 'thai', 'vietnam', 'vietnamese', 'malaysia', 'malaysian',
  'brazil', 'brazilian', 'mexico', 'mexican', 'argentina', 'argentinian',
  'chile', 'chilean', 'colombia', 'colombian', 'peru', 'peruvian',
  'south africa', 'south african', 'nigeria', 'nigerian', 'kenya', 'kenyan',
  'egypt', 'egyptian', 'israel', 'israeli', 'turkey', 'turkish',
  'iran', 'iranian', 'pakistan', 'pakistani', 'bangladesh', 'bangladeshi',
  'sri lanka', 'sri lankan', 'nepal', 'nepali',
  // cities
  'london', 'oxford', 'cambridge', 'edinburgh', 'manchester', 'glasgow',
  'dublin', 'belfast',
  'new york', 'nyc', 'san francisco', 'bay area', 'sf bay',
  'los angeles', 'chicago', 'boston', 'seattle', 'austin', 'washington dc',
  'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary',
  'sydney', 'melbourne', 'brisbane', 'perth', 'auckland', 'wellington',
  'berlin', 'munich', 'hamburg', 'frankfurt',
  'paris', 'lyon', 'amsterdam', 'rotterdam', 'brussels',
  'zurich', 'geneva', 'vienna', 'prague', 'warsaw', 'stockholm', 'oslo',
  'copenhagen', 'helsinki', 'lisbon', 'madrid', 'barcelona',
  'rome', 'milan', 'athens', 'budapest', 'moscow', 'kyiv', 'kiev',
  'tokyo', 'osaka', 'kyoto', 'seoul', 'beijing', 'shanghai', 'shenzhen',
  'hong kong', 'taipei', 'bangkok', 'jakarta', 'manila',
  'kuala lumpur', 'ho chi minh', 'hanoi',
  'dubai', 'abu dhabi', 'doha', 'riyadh', 'tel aviv', 'jerusalem',
  'lagos', 'nairobi', 'cape town', 'johannesburg',
  'sao paulo', 'rio de janeiro', 'buenos aires', 'mexico city',
  'lahore', 'karachi', 'islamabad', 'dhaka', 'colombo', 'kathmandu',
  // regions
  'europe', 'european', 'north america', 'latin america',
  'middle east', 'east asia', 'southeast asia', 'south east asia',
  'africa', 'african', 'oceania',
]

const NON_INDIA_PLACE_REGEX = new RegExp(
  '\\b(' + NON_INDIA_PLACES.map((p) => p.replace(/[.\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
)

function isVirtual(locType) {
  const t = (locType || '').toLowerCase()
  return t.includes('online') || t.includes('zoom') || t.includes('virtual') || t.includes('remote')
}

function titleMentionsNonIndiaPlace(title) {
  if (!title) return false
  return NON_INDIA_PLACE_REGEX.test(title)
}

function passesIndiaOrOnlineFilter(item) {
  const event = item.event ?? {}
  if (isVirtual(event.location_type)) {
    return !titleMentionsNonIndiaPlace(event.name)
  }

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

function sourceLabel(item) {
  const calendar = item.calendar ?? {}
  const hosts = item.hosts ?? []
  // Single-event URLs from users without a public calendar fall back to a
  // "Personal" calendar, which reads as "Via Personal on Luma". Prefer the
  // host's name in that case so the attribution makes sense.
  if (calendar.is_personal && hosts[0]?.name) return hosts[0].name
  return calendar.name ?? 'Luma'
}

function transformItem(item) {
  const event = item.event ?? {}
  return {
    source: 'luma',
    source_id: event.api_id,
    title: event.name,
    description: `Via ${sourceLabel(item)} on Luma`,
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

async function fetchSource(url) {
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

  const d = nextData?.props?.pageProps?.initialData?.data

  if (Array.isArray(d?.featured_items)) {
    return d.featured_items
  }
  if (d?.event) {
    return [{ event: d.event, calendar: d.calendar ?? null, hosts: d.hosts ?? null }]
  }
  throw new Error(`Unsupported Luma page (no calendar listing or event data) for ${url}`)
}

export async function GET() {
  const allEvents = []
  const rejectedIds = []
  const errors = []

  for (const url of LUMA_URLS) {
    try {
      const items = await fetchSource(url)
      for (const item of items) {
        const apiId = item?.event?.api_id
        if (!apiId) continue
        if (!passesIndiaOrOnlineFilter(item)) {
          rejectedIds.push(apiId)
          continue
        }
        allEvents.push(transformItem(item))
      }
    } catch (err) {
      console.error(`[fetch-luma] ${url}:`, err.message)
      errors.push({ url, error: err.message })
    }
  }

  if (allEvents.length === 0 && rejectedIds.length === 0) {
    return Response.json(
      { success: false, count: 0, errors },
      { status: errors.length ? 502 : 200 }
    )
  }

  if (allEvents.length > 0) {
    const { error } = await supabase
      .from('events')
      .upsert(allEvents, { onConflict: 'source,source_id' })

    if (error) {
      return Response.json(
        { success: false, error: error.message, errors },
        { status: 500 }
      )
    }
  }

  let pruned = 0
  if (rejectedIds.length > 0) {
    const { error: pruneError, count } = await supabase
      .from('events')
      .delete({ count: 'exact' })
      .eq('source', 'luma')
      .in('source_id', rejectedIds)

    if (pruneError) {
      console.error('[fetch-luma] prune error:', pruneError.message)
    } else {
      pruned = count ?? 0
    }
  }

  return Response.json({ success: true, count: allEvents.length, pruned, errors })
}
