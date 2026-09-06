import { useQuery } from '@tanstack/react-query'
import { getWeeklySummary } from '../../api/timeEntries'
import { mondayOfWeek } from '../../lib/dateUtils'
import { formatMinutes } from '../../lib/durationParser'

interface Props {
  date: string
  onDateClick: (d: string) => void
  todayMinutes: number
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

export function WeeklySummary({ date, onDateClick, todayMinutes }: Props) {
  const monday = mondayOfWeek(date)
  const { data } = useQuery({
    queryKey: ['weekly-summary', monday],
    queryFn: () => getWeeklySummary(date),
  })

  const completion = Math.min(100, Math.round(((data?.totalMinutes ?? 0) / (40 * 60)) * 100))

  return (
    <section className="week-overview" aria-label={`Vecka ${data?.weekNumber ?? ''}`}>
      <div className="week-overview-top">
        <div className="week-caption">
          <strong>Vecka {data?.weekNumber}</strong>
          <span className="divider" aria-hidden="true" />
          <span>{formatMinutes(data?.totalMinutes ?? 0)} totalt</span>
        </div>

        <div className="summary-instruments">
          <div className="summary-instrument">
            <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <small>Idag</small>
            <span>{formatMinutes(todayMinutes)}</span>
          </div>
          <div className="summary-instrument">
            <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
            <small>Vecka {data?.weekNumber}</small>
            <span>{formatMinutes(data?.totalMinutes ?? 0)}</span>
          </div>
          <div className="summary-instrument">
            <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 8.4 5.8" /></svg>
            <small>Klargrad</small>
            <span>{completion} %</span>
          </div>
        </div>
      </div>

      <div className="week-strip">
          {(data?.days ?? []).map(day => {
            const isSelected = day.date === date
            return (
              <button
                key={day.date}
                onClick={() => onDateClick(day.date)}
                className={`week-day ${isSelected ? 'is-selected' : ''}`}
                aria-pressed={isSelected}
              >
                <span className="week-day-name">{new Intl.DateTimeFormat('sv-SE', { weekday: 'short' }).format(new Date(day.date + 'T00:00:00')).replace('.', '')}</span>
                <span className="week-day-date">{formatDayLabel(day.date).replace(/^\S+\s/, '')}</span>
                <span className="week-day-total">{day.totalMinutes > 0 ? formatMinutes(day.totalMinutes) : '–'}</span>
              </button>
            )
          })}
      </div>
    </section>
  )
}
