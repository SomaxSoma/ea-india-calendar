'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { supabase } from '../../lib/supabase'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-jakarta',
})

const TEAL = '#0EA5A0'

const eventLabelFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatEventLabel(evt) {
  return `${evt.title} — ${eventLabelFmt.format(new Date(evt.start_date))}`
}

export default function SuggestCorrectionPage() {
  return (
    <Suspense fallback={null}>
      <SuggestCorrectionForm />
    </Suspense>
  )
}

function SuggestCorrectionForm() {
  const searchParams = useSearchParams()
  const initialEventId = searchParams.get('event_id') || ''

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [form, setForm] = useState({
    event_id: initialEventId,
    message: '',
    email: '',
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_date')
        .eq('status', 'approved')
        .order('start_date', { ascending: true })
      if (cancelled) return
      if (error) setLoadError(error.message)
      else setEvents(data || [])
      setLoadingEvents(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!initialEventId) return
    if (!events.length) return
    const exists = events.some((e) => String(e.id) === String(initialEventId))
    if (exists) setForm((f) => (f.event_id ? f : { ...f, event_id: initialEventId }))
  }, [events, initialEventId])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.event_id || !form.message.trim()) return
    setSubmitting(true)
    setStatus(null)

    try {
      const res = await fetch('/api/suggest-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: form.event_id,
          message: form.message.trim(),
          email: form.email.trim() || undefined,
        }),
      })

      if (!res.ok) {
        setStatus('error')
      } else {
        setStatus('success')
        setForm({ event_id: '', message: '', email: '' })
      }
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors'

  return (
    <div
      className={`${jakarta.variable} min-h-screen bg-slate-50 text-slate-800`}
      style={{ fontFamily: 'var(--font-sans-jakarta), ui-sans-serif, system-ui' }}
    >
      {/* NAV */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/favicon.png"
              alt="EA India"
              width={36}
              height={36}
              className="rounded-md"
              priority
            />
            <span className="font-semibold text-slate-900 tracking-tight text-[15px] sm:text-base">
              EA India Events
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to events
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <span
            className="inline-block text-[11px] font-semibold tracking-wider uppercase mb-4 px-3 py-1 rounded-full border"
            style={{
              color: TEAL,
              borderColor: 'rgba(14,165,160,0.25)',
              backgroundColor: 'rgba(14,165,160,0.07)',
            }}
          >
            Help keep things accurate
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Suggest a Correction
          </h1>
          <p className="mt-3 text-slate-600 text-[15px] leading-relaxed">
            Found something wrong with an event listing? Let us know.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-7 space-y-5"
        >
          {/* Event select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Event <span style={{ color: TEAL }}>*</span>
            </label>
            <select
              name="event_id"
              required
              value={form.event_id}
              onChange={handleChange}
              disabled={loadingEvents || Boolean(loadError)}
              className={`${inputClass} cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed`}
            >
              <option value="" disabled>
                {loadingEvents
                  ? 'Loading events…'
                  : loadError
                  ? 'Could not load events'
                  : events.length === 0
                  ? 'No events available'
                  : 'Choose an event…'}
              </option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {formatEventLabel(evt)}
                </option>
              ))}
            </select>
            {loadError && (
              <p className="mt-1.5 text-xs text-rose-600">
                {loadError}
              </p>
            )}
          </div>

          {/* Correction message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              What needs correcting? <span style={{ color: TEAL }}>*</span>
            </label>
            <textarea
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
              placeholder="e.g. The date should be April 20, not April 18. The registration link is broken. Location is wrong."
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com — in case we need to follow up"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || loadingEvents || Boolean(loadError)}
            className="w-full mt-1 text-white font-semibold text-sm py-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: TEAL }}
          >
            {submitting ? 'Submitting…' : 'Submit Correction'}
          </button>

          {/* Status messages */}
          {status === 'success' && (
            <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              Correction submitted! We'll review it shortly.
            </div>
          )}
          {status === 'error' && (
            <div className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              Something went wrong. Please try again.
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Corrections are reviewed by the organizers before being applied.
        </p>
      </div>
    </div>
  )
}
