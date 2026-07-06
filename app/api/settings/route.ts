import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/db'

// Public — returns booking open/closed status for the frontend bubble
export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({ bookingOpen: settings.bookingOpen })
}
