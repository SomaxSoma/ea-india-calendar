'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { supabase } from '../lib/supabase'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-jakarta',
})

const TEAL = '#0EA5A0'

const TYPE_META = {
  meetup:     { label: 'Meetup',     chipBg: 'bg-teal-50',    chipText: 'text-teal-700',    chipBorder: 'border-teal-200' },
  bootcamp:   { label: 'Bootcamp',   chipBg: 'bg-cyan-50',    chipText: 'text-cyan-700',    chipBorder: 'border-cyan-200' },
  course:     { label: 'Course',     chipBg: 'bg-sky-50',     chipText: 'text-sky-700',     chipBorder: 'border-sky-200' },
  conference: { label: 'Conference', chipBg: 'bg-emerald-50', chipText: 'text-emerald-700', chipBorder: 'border-emerald-200' },
  workshop:   { label: 'Workshop',   chipBg: 'bg-indigo-50',  chipText: 'text-indigo-700',  chipBorder: 'border-indigo-200' },
}

const TYPE_FILTERS = ['all', 'meetup', 'bootcamp', 'course', 'conference', 'workshop']
const MODE_FILTERS = ['all', 'online', 'in-person']

const monthFmt   = new Intl.DateTimeFormat('en-US', { month: 'long',  year: 'numeric' })
const shortFmt   = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const shortYrFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const dayNumFmt  = new Intl.DateTimeFormat('en-US', { day: '2-digit' })
const dayMonFmt  = new Intl.DateTimeFormat('en-US', { month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

function formatRange(startISO, endISO) {
  const start = new Date(startISO)
  if (!endISO) return shortYrFmt.format(start)
  const end = new Date(endISO)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameDay  = start.toDateString() === end.toDateString()
  if (sameDay) return shortYrFmt.format(start)
  if (sameYear) return `${shortFmt.format(start)} – ${shortFmt.format(end)}, ${end.getFullYear()}`
  return `${shortYrFmt.format(start)} – ${shortYrFmt.format(end)}`
}

function isOnline(locations) {
  if (!Array.isArray(locations)) return false
  return locations.some((l) => /online|virtual|remote|zoom/i.test(l))
}

export default function EventsPage() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const todayISO = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', todayISO)
        .order('start_date', { ascending: true })
      if (cancelled) return
      if (error) setError(error.message)
      else setEvents(data || [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (modeFilter === 'online'    && !isOnline(e.location)) return false
      if (modeFilter === 'in-person' &&  isOnline(e.location) && (e.location?.length ?? 0) <= 1) return false
      return true
    })
  }, [events, typeFilter, modeFilter])

  const grouped = useMemo(() => {
    const groups = []
    let currentKey = null
    for (const evt of filtered) {
      const d = new Date(evt.start_date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key !== currentKey) {
        groups.push({ key, label: monthFmt.format(d), items: [] })
        currentKey = key
      }
      groups[groups.length - 1].items.push(evt)
    }
    return groups
  }, [filtered])

  return (
    <div className={`${jakarta.variable} min-h-screen bg-slate-50 text-slate-800`} style={{ fontFamily: 'var(--font-sans-jakarta), ui-sans-serif, system-ui' }}>
      {/* NAV */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-sm supports-[backdrop-filter]:bg-white/85">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
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
            href="/submit"
            className="inline-flex items-center gap-1.5 rounded-full text-white font-medium text-[13px] sm:text-sm px-4 py-2 shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: TEAL }}
          >
            Submit Event
            <span>→</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-8 sm:pb-12">
        <span
          className="inline-block text-[11px] font-semibold tracking-wider uppercase mb-4 px-3 py-1 rounded-full border"
          style={{ color: TEAL, borderColor: 'rgba(14,165,160,0.25)', backgroundColor: 'rgba(14,165,160,0.07)' }}
        >
          Community Calendar
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
          EA India <span style={{ color: TEAL }}>Events</span>
        </h1>
        <p className="mt-5 sm:mt-6 max-w-2xl text-slate-600 text-base sm:text-lg leading-relaxed">
          Upcoming AI safety and effective altruism events — in India and online. Meetups, bootcamps, courses, and more.
        </p>
      </section>

      {/* FILTERS */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterGroup
            label="Type"
            options={TYPE_FILTERS.map((t) => ({ value: t, label: t === 'all' ? 'All' : TYPE_META[t].label }))}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <FilterGroup
            label="Mode"
            options={MODE_FILTERS.map((m) => ({ value: m, label: m === 'all' ? 'All' : m === 'online' ? 'Online' : 'In-person' }))}
            value={modeFilter}
            onChange={setModeFilter}
          />
        </div>
      </section>

      {/* LIST */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        {loading && <SkeletonList />}

        {!loading && error && (
          <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm">
            Couldn't load events: {error}
          </p>
        )}

        {!loading && !error && grouped.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: TEAL }}>
              Nothing scheduled
            </p>
            <p className="text-slate-700 text-lg font-medium">
              No events match these filters — yet.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Know of one? <Link href="/submit" className="underline" style={{ color: TEAL }}>Submit it here</Link>.
            </p>
          </div>
        )}

        {!loading && !error && grouped.map((group) => (
          <section key={group.key} className="mb-10 last:mb-0">
            <MonthDivider label={group.label} count={group.items.length} />
            <ul className="mt-5 space-y-3 sm:space-y-4">
              {group.items.map((evt, i) => (
                <EventCard key={evt.id} event={evt} index={i} />
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-sm text-slate-500">
          <span>Curated for the Indian EA &amp; AI-safety community.</span>
          <Link href="/submit" className="font-medium hover:underline" style={{ color: TEAL }}>
            Submit an event →
          </Link>
        </div>
      </footer>
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={[
                'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap border',
                active
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
              style={active ? { backgroundColor: TEAL } : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthDivider({ label, count }) {
  return (
    <div className="flex items-baseline gap-4 sm:gap-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        {label}
      </h2>
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 tabular-nums">
        {count} {count === 1 ? 'event' : 'events'}
      </span>
    </div>
  )
}

function EventCard({ event }) {
  const type = TYPE_META[event.type] ?? TYPE_META.meetup
  const start = new Date(event.start_date)
  const hasLink = Boolean(event.link)
  const locations = Array.isArray(event.location) ? event.location.filter(Boolean) : []

  const mailtoHref =
    `mailto:admin@networkforimpact.in` +
    `?subject=${encodeURIComponent(`Correction: ${event.title}`)}` +
    `&body=${encodeURIComponent(
      `Event: ${event.title}\nEvent date: ${event.start_date}\n\nSuggested correction:\n`
    )}`

  return (
    <li>
      <article className="group relative grid grid-cols-[auto_1fr] sm:grid-cols-[88px_1fr_auto] gap-x-5 sm:gap-x-7 gap-y-3 p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
        {/* Date block */}
        <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 sm:pr-2 sm:border-r sm:border-slate-100">
          <div className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: TEAL }}>
            {weekdayFmt.format(start)}
          </div>
          <div className="text-slate-900 text-3xl sm:text-4xl font-bold leading-none tabular-nums">
            {dayNumFmt.format(start)}
          </div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 sm:mt-1">
            {dayMonFmt.format(start)}
          </div>
        </div>

        {/* Main */}
        <div className="col-span-2 sm:col-span-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${type.chipBg} ${type.chipText} ${type.chipBorder}`}>
              {type.label}
            </span>
            <span className="text-[12px] text-slate-500">
              {formatRange(event.start_date, event.end_date)}
            </span>
          </div>

          {hasLink ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-sm"
            >
              <h3 className="text-slate-900 text-lg sm:text-xl font-semibold leading-snug tracking-tight group-hover:text-teal-700 transition-colors">
                {event.title}
              </h3>
            </a>
          ) : (
            <h3 className="text-slate-900 text-lg sm:text-xl font-semibold leading-snug tracking-tight">
              {event.title}
            </h3>
          )}

          {event.description && (
            <p className="mt-2 text-slate-600 text-[14.5px] leading-relaxed line-clamp-3">
              {event.description}
            </p>
          )}

          {(locations.length > 0 || event.registration_close) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-2">
              {locations.map((loc, i) => (
                <span
                  key={`${loc}-${i}`}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11.5px] font-medium"
                >
                  {loc}
                </span>
              ))}
              {event.registration_close && (
                <span className="text-[11.5px] text-slate-500 pl-1">
                  Reg. closes {shortFmt.format(new Date(event.registration_close))}
                </span>
              )}
            </div>
          )}

          {/* Footer actions (mobile inline, desktop hidden) */}
          <div className="mt-4 flex items-center gap-4 sm:hidden">
            {hasLink && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium inline-flex items-center gap-1.5"
                style={{ color: TEAL }}
              >
                View Event <span>→</span>
              </a>
            )}
            <a
              href={mailtoHref}
              className="text-[12px] text-slate-400 hover:text-slate-700 hover:underline"
            >
              Suggest correction
            </a>
          </div>
        </div>

        {/* Action column (desktop) */}
        <div className="hidden sm:flex flex-col items-end justify-between col-start-3 row-start-1 h-full">
          {hasLink ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium inline-flex items-center gap-1.5 group-hover:gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded-sm"
              style={{ color: TEAL }}
            >
              View Event
              <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          ) : (
            <span />
          )}
          <a
            href={mailtoHref}
            className="text-[11.5px] text-slate-400 hover:text-slate-700 hover:underline"
          >
            Suggest correction
          </a>
        </div>
      </article>
    </li>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[140px] rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}
