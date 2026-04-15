import { NextResponse } from 'next/server'
import { getServices } from '@/lib/db'

export async function GET() {
  return NextResponse.json(await getServices())
}
