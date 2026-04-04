import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'services.json')

export async function GET() {
  const data = fs.readFileSync(dataPath, 'utf-8')
  const services = JSON.parse(data)
  return NextResponse.json(services)
}
