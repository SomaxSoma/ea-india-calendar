'use client'

import { useState } from 'react'

export default function SubmitEvent() {
  const [form, setForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
    description: '',
    link: '',
    location: '',
    type: 'meetup'
  })
  const [status, setStatus] = useState(null) // 'success' | 'duplicate' | 'error'
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const payload = {
        title: form.title,
        start_date: new Date(form.start_date).toISOString(),
      }
      if (form.end_date) payload.end_date = new Date(form.end_date).toISOString()
      if (form.description) payload.description = form.description
      if (form.link) payload.link = form.link
      if (form.location) payload.location = form.location
      if (form.type) payload.type = form.type

      const res = await fetch('/api/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.status === 409) {
        setStatus('duplicate')
      } else if (!res.ok) {
        setStatus('error')
      } else {
        setStatus('success')
        setForm({
          title: '',
          start_date: '',
          end_date: '',
          description: '',
          link: '',
          location: '',
          type: 'meetup'
        })
      }
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 relative overflow-hidden">
      {/* Decorative background grain */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Accent glow */}
      <div className="fixed top-[-40%] right-[-20%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-orange-600/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-400 text-xs tracking-[0.3em] uppercase mb-3 font-medium">
            Community Events
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-50 leading-tight">
            Submit an Event
          </h1>
          <div className="mt-3 h-px w-16 bg-gradient-to-r from-amber-500 to-transparent" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
              Title <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              placeholder="What's the event called?"
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
                Start Date <span className="text-amber-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_date"
                required
                value={form.start_date}
                onChange={handleChange}
                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors resize-none"
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
              Link
            </label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              placeholder="https://..."
            />
          </div>

          {/* Location + Type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                placeholder="City, Country or Online"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wide uppercase text-stone-400 mb-2">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors appearance-none cursor-pointer"
              >
                <option value="meetup">Meetup</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="course">Course</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-stone-950 font-semibold text-sm tracking-wide py-3.5 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Event'}
          </button>

          {/* Status messages */}
          {status === 'success' && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              Event submitted!
            </div>
          )}
          {status === 'duplicate' && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              This event already exists
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              Something went wrong, please try again
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-stone-600">
          Events are reviewed before appearing on the calendar.
        </p>
      </div>
    </div>
  )
}
