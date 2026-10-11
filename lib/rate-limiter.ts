import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitInfo>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, info] of store.entries()) {
    if (info.resetTime < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config

  return async function rateLimiter(
    request: NextRequest,
    key?: string
  ): Promise<{ success: boolean; remaining: number; resetTime: number; response?: NextResponse }> {
    const identifier = key || request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
    const fullKey = `${keyPrefix}:${identifier}`

    const now = Date.now()
    const existing = store.get(fullKey)

    if (!existing || existing.resetTime < now) {
      // First request or window expired
      const resetTime = now + windowMs
      store.set(fullKey, { count: 1, resetTime })
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime,
      }
    }

    if (existing.count >= maxRequests) {
      // Rate limit exceeded
      const response = NextResponse.json(
        { error: 'Too Many Requests', message: 'Terlalu banyak permintaan, silakan coba lagi nanti' },
        { status: 429, headers: { 'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString() } }
      )
      return {
        success: false,
        remaining: 0,
        resetTime: existing.resetTime,
        response,
      }
    }

    // Increment count
    existing.count++
    store.set(fullKey, existing)

    return {
      success: true,
      remaining: maxRequests - existing.count,
      resetTime: existing.resetTime,
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyPrefix: 'api',
})

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 minutes
  keyPrefix: 'auth',
})

export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  keyPrefix: 'search',
})

export const mutationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 mutations per minute
  keyPrefix: 'mutation',
})