import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'mobile-charges.json')

// Public — customers need to load area fees before submitting a booking
export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ areas: [] })
  }
}
