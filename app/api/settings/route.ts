import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/db'

// Public — non-sensitive settings the booking page needs
export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({
    bookingOpen: settings.bookingOpen,
    gelUpgradePrice: settings.gelUpgradePrice,
  })
}
