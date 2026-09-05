'use client'

export function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function BookingCalendar({
  unavailableDates,
  selectedDate,
  onSelectDate,
  viewing,
  onPrev,
  onNext,
}: {
  unavailableDates: Set<string>
  selectedDate: string
  onSelectDate: (date: string) => void
  viewing: Date
  onPrev: () => void
  onNext: () => void
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const year = viewing.getFullYear()
  const month = viewing.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = viewing.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={onPrev} className="w-11 h-11 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-2xl transition-colors">‹</button>
        <p className="font-sub font-bold text-darkbrown tracking-wide text-lg">{monthLabel}</p>
        <button type="button" onClick={onNext} className="w-11 h-11 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-2xl transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-xs font-body font-bold uppercase tracking-widest text-darkbrown/30 py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = toDateKey(year, month + 1, day)
          const isPast = new Date(year, month, day) < today
          const isUnavailable = unavailableDates.has(key)
          const disabled = isPast || isUnavailable
          const isSelected = key === selectedDate
          const isToday = key === todayKey

          return (
            <button
              key={day}
              type="button"
              onClick={() => !disabled && onSelectDate(key)}
              disabled={disabled}
              title={isUnavailable && !isPast ? 'Fully booked' : undefined}
              className={`
                mx-auto w-11 h-11 sm:w-14 sm:h-14 rounded-full text-base sm:text-lg font-body flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-terracotta-500 text-cream font-bold shadow-[0_6px_16px_-4px_rgb(var(--terracotta-500)/0.6)] scale-105'
                  : disabled
                  ? 'text-darkbrown/20 cursor-not-allowed line-through'
                  : isToday
                  ? 'border-2 border-terracotta-400 text-terracotta-600 font-bold hover:bg-terracotta-50 hover:scale-105'
                  : 'hover:bg-terracotta-50 text-darkbrown/80 cursor-pointer hover:scale-105'}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      <p className="mt-5 text-[11px] font-body text-darkbrown/30 tracking-wide text-center">
        Crossed-out dates are fully booked or unavailable
      </p>
    </div>
  )
}
