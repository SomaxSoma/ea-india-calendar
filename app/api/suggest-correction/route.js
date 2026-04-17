import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.event_id || !body.message) {
      return Response.json(
        { error: 'Event and correction message are required' },
        { status: 400 }
      )
    }

    const correction = {
      event_id: body.event_id,
      message: body.message,
      email: body.email || null,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase.from('corrections').insert([correction])

    if (error) throw error

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
