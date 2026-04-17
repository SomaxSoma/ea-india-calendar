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

    const { data: evt } = await supabase
      .from('events')
      .select('title')
      .eq('id', body.event_id)
      .maybeSingle()

    const eventTitle = evt?.title || `Event #${body.event_id}`

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; max-width: 560px;">
        <h2 style="color: #0EA5A0; margin: 0 0 16px;">Correction suggested</h2>
        <p style="color: #475569; margin: 0 0 20px;">Someone submitted a correction for an event listing.</p>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Event</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(eventTitle)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Submitter</td><td style="padding: 6px 0;">${correction.email ? `<a href="mailto:${escapeHtml(correction.email)}" style="color: #0EA5A0;">${escapeHtml(correction.email)}</a>` : '<em style="color:#94a3b8;">not provided</em>'}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${escapeHtml(correction.message)}</div>
      </div>
    `
    sendNotification(`Correction suggested for: ${eventTitle}`, html).catch((e) => {
      console.error('sendNotification failed (suggest-correction):', e)
    })

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
