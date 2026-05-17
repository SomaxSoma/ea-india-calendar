import { supabase } from '../../../lib/supabase'

const INDIA_CITIES = [
  'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
  'hyderabad', 'chennai', 'pune', 'kolkata', 'ahmedabad',
  'goa', 'jaipur', 'kochi', 'lucknow', 'chandigarh'
]

const NON_INDIA_PLACES = [
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
  'europe', 'european', 'north america', 'latin america',
  'middle east', 'east asia', 'southeast asia', 'south east asia',
  'africa', 'african', 'oceania'
]

const NON_INDIA_PLACE_REGEX = new RegExp(
  '\\b(' + NON_INDIA_PLACES.map(p => p.replace(/[.\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
)

function titleMentionsNonIndiaPlace(title) {
  if (!title) return false
  return NON_INDIA_PLACE_REGEX.test(title)
}

export async function GET() {
  try {
    const res = await fetch('https://www.lesswrong.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          posts(input: { terms: { filter: "events", limit: 50 } }) {
            results {
              _id
              title
              startTime
              endTime
              contents { plaintextDescription }
              location
              onlineEvent
            }
          }
        }`
      })
    })

    const data = await res.json()

    const rejectedIds = []
    const posts = data.data.posts.results.filter(post => {
      let keep
      if (post.onlineEvent) {
        keep = !titleMentionsNonIndiaPlace(post.title)
      } else if (post.location) {
        const loc = post.location.toLowerCase()
        keep = INDIA_CITIES.some(city => loc.includes(city))
      } else {
        keep = false
      }
      if (!keep && post._id) rejectedIds.push(post._id)
      return keep
    })

    const events = posts.map(post => {
      const location = []
      if (post.location) location.push(post.location)
      if (post.onlineEvent) location.push('Online')

      return {
        source: 'lesswrong',
        source_id: post._id,
        title: post.title,
        description: post.contents?.plaintextDescription || null,
        link: `https://www.lesswrong.com/events/${post._id}`,
        start_date: post.startTime,
        end_date: post.endTime || null,
        location: location,
        type: 'meetup',
        registration_close: null,
        status: 'approved',
        updated_at: new Date().toISOString()
      }
    })

    if (events.length > 0) {
      const { error } = await supabase
        .from('events')
        .upsert(events, { onConflict: 'source,source_id' })

      if (error) throw error
    }

    let pruned = 0
    if (rejectedIds.length > 0) {
      const { error: pruneError, count } = await supabase
        .from('events')
        .delete({ count: 'exact' })
        .eq('source', 'lesswrong')
        .in('source_id', rejectedIds)

      if (pruneError) {
        console.error('[fetch-lesswrong] prune error:', pruneError.message)
      } else {
        pruned = count ?? 0
      }
    }

    return Response.json({ success: true, count: events.length, pruned })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
