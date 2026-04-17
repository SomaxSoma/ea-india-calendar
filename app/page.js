'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Fraunces, JetBrains_Mono, Manrope } from 'next/font/google'
import { supabase } from '../lib/supabase'

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'opsz'],
  variable: '--font-fraunces',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-display',
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const TYPE_META = {
  meetup:     { label: 'Meetup',     dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/30' },
  bootcamp:   { label: 'Bootcamp',   dot: 'bg-amber-400',   text: 'text-amber-300',   ring: 'ring-amber-400/30' },
  course:     { label: 'Course',     dot: 'bg-sky-400',     text: 'text-sky-300',     ring: 'ring-sky-400/30' },
  conference: { label: 'Conference', dot: 'bg-rose-400',    text: 'text-rose-300',    ring: 'ring-rose-400/30' },
  workshop:   { label: 'Workshop',   dot: 'bg-violet-400',  text: 'text-violet-300',  ring: 'ring-violet-400/30' },
}

const TYPE_FILTERS = ['all', 'meetup', 'bootcamp', 'course', 'conference', 'workshop']
const MODE_FILTERS = ['all', 'online', 'in-person']

const monthFmt    = new Intl.DateTimeFormat('en-US', { month: 'long',   year: 'numeric' })
const shortFmt    = new Intl.DateTimeFormat('en-US', { month: 'short',  day: 'numeric' })
const shortYrFmt  = new Intl.DateTimeFormat('en-US', { month: 'short',  day: 'numeric', year: 'numeric' })
const dayNumFmt   = new Intl.DateTimeFormat('en-US', { day: '2-digit' })
const dayMonFmt   = new Intl.DateTimeFormat('en-US', { month: 'short' })
const weekdayFmt  = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

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
    <div className={`${fraunces.variable} ${mono.variable} ${manrope.variable} min-h-screen bg-stone-950 text-stone-100 relative overflow-hidden`}>
      {/* paper grain */}
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* ambient glows */}
      <div className="fixed top-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-amber-500/[0.06] blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-orange-700/[0.05] blur-[110px] pointer-events-none" />
      {/* faint vertical rule */}
      <div className="hidden lg:block fixed top-0 bottom-0 left-[calc(50%-480px)] w-px bg-stone-100/[0.04] pointer-events-none" />

      <div className="relative z-10" style={{ fontFamily: 'var(--font-body), ui-sans-serif, system-ui' }}>
        {/* NAV */}
        <header className="border-b border-stone-100/[0.06]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="block w-2 h-2 rounded-full bg-amber-400 group-hover:bg-amber-300 transition-colors" />
              <span
                className="text-[11px] tracking-[0.35em] uppercase text-stone-300 group-hover:text-stone-100 transition-colors"
                style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
              >
                EA · India
              </span>
            </Link>
            <Link
              href="/submit"
              className="group inline-flex items-center gap-2 rounded-full border border-stone-100/10 hover:border-amber-400/60 bg-stone-900/40 hover:bg-amber-400/10 pl-4 pr-3 py-1.5 text-[12px] tracking-wide text-stone-200 hover:text-amber-200 transition-all"
            >
              Submit Event
              <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-14 sm:pt-24 pb-10 sm:pb-16">
          <p
            className="text-amber-400/90 text-[10px] sm:text-[11px] tracking-[0.4em] uppercase mb-5 sm:mb-7 reveal"
            style={{ fontFamily: 'var(--font-mono-display), ui-monospace', animationDelay: '0ms' }}
          >
            ⟢ Calendar · Vol. {new Date().getFullYear()}
          </p>
          <h1
            className="reveal text-[44px] leading-[0.95] sm:text-[88px] sm:leading-[0.92] tracking-[-0.025em] text-stone-50 font-light"
            style={{ fontFamily: 'var(--font-fraunces), serif', fontVariationSettings: '"SOFT" 100, "opsz" 144', animationDelay: '70ms' }}
          >
            EA <span className="italic text-amber-300/95" style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}>India</span>
            <br />
            Events.
          </h1>
          <p
            className="reveal mt-6 sm:mt-8 max-w-xl text-stone-400 text-[15px] sm:text-[17px] leading-relaxed"
            style={{ animationDelay: '140ms' }}
          >
            Upcoming AI safety and effective altruism events — in India and online. Meetups, bootcamps, courses, and more.
          </p>
        </section>

        {/* FILTER BAR */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-10 reveal" style={{ animationDelay: '220ms' }}>
          <div className="flex flex-col gap-5 sm:gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-stone-100/[0.06] py-5">
            <FilterGroup
              label="Type"
              options={TYPE_FILTERS.map((t) => ({ value: t, label: t === 'all' ? 'All' : TYPE_META[t].label }))}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            <FilterGroup
              label="Mode"
              options={MODE_FILTERS.map((m) => ({ value: m, label: m === 'all' ? 'All' : m === 'online' ? 'Online' : 'In-person' }))}
              value={modeFilter}
              onChange={setModeFilter}
            />
          </div>
        </section>

        {/* LIST */}
        <main className="max-w-5xl mx-auto px-5 sm:px-8 pb-32">
          {loading && <SkeletonList />}
          {!loading && error && (
            <p className="text-rose-300 text-sm py-10">Couldn't load events: {error}</p>
          )}
          {!loading && !error && grouped.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="text-stone-500 text-[11px] tracking-[0.3em] uppercase mb-3"
                style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
              >
                Nothing scheduled
              </p>
              <p className="text-stone-300 text-lg" style={{ fontFamily: 'var(--font-fraunces), serif' }}>
                No events match these filters — yet.
              </p>
            </div>
          )}

          {!loading && !error && grouped.map((group, gIdx) => (
            <section key={group.key} className="mb-14 last:mb-0">
              <MonthDivider label={group.label} count={group.items.length} delay={gIdx * 30} />
              <ul className="mt-6 space-y-3 sm:space-y-4">
                {group.items.map((evt, i) => (
                  <EventCard key={evt.id} event={evt} index={i} />
                ))}
              </ul>
            </section>
          ))}
        </main>

        <footer className="border-t border-stone-100/[0.06]">
          <div
            className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-[11px] tracking-[0.25em] uppercase text-stone-500 flex flex-col sm:flex-row gap-3 justify-between"
            style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
          >
            <span>⟢ Curated for the Indian EA &amp; AI-safety community</span>
            <Link href="/submit" className="hover:text-amber-300 transition-colors">Submit an event →</Link>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);  }
        }
        .reveal {
          opacity: 0;
          animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
      <span
        className="shrink-0 text-[10px] tracking-[0.35em] uppercase text-stone-500"
        style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
      >
        {label} /
      </span>
      <div className="flex items-center gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={[
                'px-3 py-1.5 rounded-full text-[12px] tracking-wide transition-all whitespace-nowrap',
                active
                  ? 'bg-amber-400 text-stone-950 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]'
                  : 'text-stone-400 hover:text-stone-100 border border-stone-100/[0.08] hover:border-stone-100/20',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthDivider({ label, count, delay = 0 }) {
  return (
    <div className="reveal flex items-baseline gap-4 sm:gap-6" style={{ animationDelay: `${delay}ms` }}>
      <h2
        className="text-stone-100 text-2xl sm:text-3xl tracking-tight"
        style={{ fontFamily: 'var(--font-fraunces), serif', fontVariationSettings: '"SOFT" 100, "opsz" 72', fontStyle: 'italic', fontWeight: 400 }}
      >
        {label}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-stone-100/15 via-stone-100/[0.04] to-transparent" />
      <span
        className="text-[10px] tracking-[0.3em] uppercase text-stone-500 tabular-nums"
        style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
      >
        {String(count).padStart(2, '0')} {count === 1 ? 'event' : 'events'}
      </span>
    </div>
  )
}

function EventCard({ event, index }) {
  const type = TYPE_META[event.type] ?? TYPE_META.meetup
  const start = new Date(event.start_date)
  const hasLink = Boolean(event.link)
  const locations = Array.isArray(event.location) ? event.location.filter(Boolean) : []

  const body = (
    <article
      className="reveal group relative grid grid-cols-[auto_1fr] sm:grid-cols-[96px_1fr_auto] gap-x-5 sm:gap-x-8 gap-y-3 p-5 sm:p-7 rounded-2xl border border-stone-100/[0.07] bg-stone-900/30 hover:bg-stone-900/55 hover:border-amber-400/25 transition-all duration-300"
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      {/* Date block */}
      <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
        <div
          className="text-[10px] tracking-[0.3em] uppercase text-amber-400/80"
          style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
        >
          {weekdayFmt.format(start)}
        </div>
        <div
          className="text-stone-50 text-4xl sm:text-5xl leading-none tabular-nums"
          style={{ fontFamily: 'var(--font-fraunces), serif', fontVariationSettings: '"SOFT" 100, "opsz" 72', fontWeight: 300 }}
        >
          {dayNumFmt.format(start)}
        </div>
        <div
          className="text-[11px] tracking-[0.25em] uppercase text-stone-400 sm:mt-1"
          style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
        >
          {dayMonFmt.format(start)}
        </div>
      </div>

      {/* Main */}
      <div className="col-span-2 sm:col-span-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${type.dot}`} />
          <span
            className={`text-[10px] tracking-[0.3em] uppercase ${type.text}`}
            style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
          >
            {type.label}
          </span>
          <span
            className="text-[10px] tracking-[0.2em] uppercase text-stone-500"
            style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
          >
            · {formatRange(event.start_date, event.end_date)}
          </span>
        </div>

        <h3
          className="text-stone-50 text-[22px] sm:text-[26px] leading-[1.15] tracking-tight group-hover:text-amber-100 transition-colors"
          style={{ fontFamily: 'var(--font-fraunces), serif', fontVariationSettings: '"SOFT" 50, "opsz" 72', fontWeight: 400 }}
        >
          {event.title}
        </h3>

        {event.description && (
          <p
            className="mt-2 text-stone-400 text-[14.5px] leading-relaxed line-clamp-3"
            style={{ fontFamily: 'var(--font-body), ui-sans-serif' }}
          >
            {event.description}
          </p>
        )}

        {(locations.length > 0 || event.registration_close) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2">
            {locations.map((loc, i) => (
              <span
                key={`${loc}-${i}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100/[0.04] border border-stone-100/[0.08] text-stone-300 text-[11px]"
              >
                <span className="text-stone-500">◦</span>{loc}
              </span>
            ))}
            {event.registration_close && (
              <span
                className="text-[11px] tracking-wide text-stone-500 pl-1"
                style={{ fontFamily: 'var(--font-mono-display), ui-monospace' }}
              >
                Reg. closes {shortFmt.format(new Date(event.registration_close))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="hidden sm:flex items-start justify-end col-start-3 row-start-1">
        {hasLink && (
          <span className="text-amber-400/90 text-[13px] tracking-wide inline-flex items-center gap-1.5 group-hover:text-amber-300 transition-colors">
            View Event
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </span>
        )}
      </div>

      {hasLink && (
        <div className="col-span-2 sm:hidden">
          <span className="text-amber-400/90 text-[13px] tracking-wide inline-flex items-center gap-1.5">
            View Event <span>→</span>
          </span>
        </div>
      )}
    </article>
  )

  if (!hasLink) return <li>{body}</li>
  return (
    <li>
      <a
        href={event.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 rounded-2xl"
      >
        {body}
      </a>
    </li>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[148px] rounded-2xl border border-stone-100/[0.05] bg-stone-900/20 animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}
