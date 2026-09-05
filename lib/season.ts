export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

// Meteorological seasons, keyed off the Arizona calendar (UTC-7, no DST)
export function currentSeason(now: Date = new Date()): Season {
  const az = new Date(now.getTime() - 7 * 60 * 60 * 1000)
  const month = az.getUTCMonth() + 1 // 1-12
  if (month === 12 || month <= 2) return 'winter'
  if (month <= 5) return 'spring'
  if (month <= 8) return 'summer'
  return 'autumn'
}
