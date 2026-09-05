'use client'

import { useEffect } from 'react'
import { currentSeason } from '@/lib/season'

// The server stamps data-season at render time, which can go stale on pages
// cached across a season change. This re-checks in the browser and corrects it.
export default function SeasonSync() {
  useEffect(() => {
    const season = currentSeason()
    if (document.documentElement.dataset.season !== season) {
      document.documentElement.dataset.season = season
    }
  }, [])
  return null
}
