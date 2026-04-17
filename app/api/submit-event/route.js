import { supabase } from '../../../lib/supabase'
import { sendNotification } from '../../../lib/email'

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

    const locationText = location.length ? location.join(', ') : 'Not specified'
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; max-width: 560px;">
        <h2 style="color: #0EA5A0; margin: 0 0 16px;">New event submitted</h2>
        <p style="color: #475569; margin: 0 0 20px;">A new event has been submitted and is pending review.</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Title</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(event.title)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Start</td><td style="padding: 6px 0;">${escapeHtml(event.start_date)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">End</td><td style="padding: 6px 0;">${escapeHtml(event.end_date || '—')}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Type</td><td style="padding: 6px 0;">${escapeHtml(event.type)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Location</td><td style="padding: 6px 0;">${escapeHtml(locationText)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Link</td><td style="padding: 6px 0;">${event.link ? `<a href="${escapeHtml(event.link)}" style="color: #0EA5A0;">${escapeHtml(event.link)}</a>` : '—'}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b; vertical-align: top;">Description</td><td style="padding: 6px 0; white-space: pre-wrap;">${escapeHtml(event.description || '—')}</td></tr>
        </table>
        <p style="color: #64748b; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          Needs review/approval before it appears on the public calendar.
        </p>
      </div>
    `
    sendNotification(`New event submitted: ${event.title}`, html).catch((e) => {
      console.error('sendNotification failed (submit-event):', e)
    })

    return Response.json({ success: true, message: 'Event submitted! It will appear after review.' })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
