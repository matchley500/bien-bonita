import { NextResponse } from 'next/server'
import { getMobileCharges } from '@/lib/db'

// Public — customers need to load area fees before submitting a booking
export async function GET() {
  return NextResponse.json(await getMobileCharges())
}
