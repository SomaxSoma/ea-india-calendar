'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-jakarta',
})

const TEAL = '#0EA5A0'

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
  const [status, setStatus] = useState(null)
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

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors'

  return (
    <div className={`${jakarta.variable} min-h-screen bg-slate-50 text-slate-800`} style={{ fontFamily: 'var(--font-sans-jakarta), ui-sans-serif, system-ui' }}>
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
            style={{ color: TEAL, borderColor: 'rgba(14,165,160,0.25)', backgroundColor: 'rgba(14,165,160,0.07)' }}
          >
            Community Events
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Submit an Event
          </h1>
          <p className="mt-3 text-slate-600 text-[15px] leading-relaxed">
            Share an upcoming AI safety or EA event with the Indian community.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-7 space-y-5"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span style={{ color: TEAL }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="What's the event called?"
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Date <span style={{ color: TEAL }}>*</span>
              </label>
              <input
                type="datetime-local"
                name="start_date"
                required
                value={form.start_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                End Date
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Link
            </label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          {/* Location + Type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className={inputClass}
                placeholder="City, Country or Online"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
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
            className="w-full mt-1 text-white font-semibold text-sm py-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: TEAL }}
          >
            {submitting ? 'Submitting...' : 'Submit Event'}
          </button>

          {/* Status messages */}
          {status === 'success' && (
            <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              Event submitted! It will appear on the calendar after review.
            </div>
          )}
          {status === 'duplicate' && (
            <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              This event already exists.
            </div>
          )}
          {status === 'error' && (
            <div className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              Something went wrong. Please try again.
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Events are reviewed before appearing on the calendar.
        </p>
      </div>
    </div>
  )
}
