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
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="w-9 h-9 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-lg transition-colors">‹</button>
        <p className="font-sub font-bold text-darkbrown tracking-wide">{monthLabel}</p>
        <button onClick={onNext} className="w-9 h-9 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-lg transition-colors">›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-body font-bold uppercase tracking-widest text-darkbrown/30 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
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
              onClick={() => !disabled && onSelectDate(key)}
              disabled={disabled}
              title={isUnavailable && !isPast ? 'Fully booked' : undefined}
              className={`
                mx-auto w-9 h-9 rounded-full text-sm font-body flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-terracotta-500 text-cream font-bold shadow-md'
                  : disabled
                  ? 'text-darkbrown/20 cursor-not-allowed line-through'
                  : isToday
                  ? 'border-2 border-terracotta-400 text-terracotta-600 font-bold hover:bg-terracotta-50'
                  : 'hover:bg-terracotta-50 text-darkbrown/80 cursor-pointer'}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-[10px] font-body text-darkbrown/30 tracking-wide text-center">
        Crossed-out dates are fully booked or unavailable
      </p>
    </div>
  )
}
