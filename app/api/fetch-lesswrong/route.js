import { supabase } from '../../../lib/supabase'

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

    const indiaCities = [
      'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
      'hyderabad', 'chennai', 'pune', 'kolkata', 'ahmedabad',
      'goa', 'jaipur', 'kochi', 'lucknow', 'chandigarh'
    ]

    const posts = data.data.posts.results.filter(post => {
      if (post.onlineEvent) return true
      if (!post.location) return false
      const loc = post.location.toLowerCase()
      return indiaCities.some(city => loc.includes(city))
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

    const { data: result, error } = await supabase
      .from('events')
      .upsert(events, { onConflict: 'source,source_id' })

    if (error) throw error

    return Response.json({ success: true, count: events.length })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
