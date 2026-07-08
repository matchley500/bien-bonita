import { pbkdf2Sync, randomBytes } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const CUSTOMER_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_SECRET || 'bien-bonita-customer-secret-change-me'
)

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const computed = pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex')
  return computed === hash
}

export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function createCustomerSession(email: string): Promise<string> {
  return new SignJWT({ role: 'customer', email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(CUSTOMER_SECRET)
}

export async function verifyCustomerSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, CUSTOMER_SECRET)
    return payload.email as string
  } catch {
    return null
  }
}
