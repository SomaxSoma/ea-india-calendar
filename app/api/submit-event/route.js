import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.title || !body.start_date) {
      return Response.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Check for duplicate: same title + same start date
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('title', body.title)
      .eq('start_date', body.start_date)
      .limit(1)

    if (existing && existing.length > 0) {
      return Response.json(
        { error: 'This event already exists' },
        { status: 409 }
      )
    }

    const location = []
    if (body.location) location.push(body.location)

    const event = {
      source: 'manual',
      source_id: `manual_${Date.now()}`,
      title: body.title,
      description: body.description || null,
      link: body.link || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      location: location,
      type: body.type || 'meetup',
      registration_close: null,
      status: 'pending',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('events').insert([event])

    if (error) throw error

    return Response.json({ success: true, message: 'Event submitted! It will appear after review.' })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
