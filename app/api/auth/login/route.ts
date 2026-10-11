import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await authRateLimiter(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    // This will be handled by NextAuth
    return NextResponse.json({ message: 'Use NextAuth for login' })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}