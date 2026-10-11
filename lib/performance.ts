import { headers } from 'next/headers'

// Performance monitoring utilities
export function markStart(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-start`)
  }
}

export function markEnd(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }
}

export function getMetrics() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('measure')
    return entries.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    }))
  }
  return []
}

// Web Vitals reporting
export function reportWebVitals(metric: any) {
  // In production, send to analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      timestamp: Date.now(),
    })

    // Use sendBeacon for reliability
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body)
    } else {
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        keepalive: true,
      }).catch(() => {})
    }
  }
}

// Server-side performance logging
export async function logServerPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  // Log slow operations (> 100ms)
  if (duration > 100) {
    console.warn(`Slow operation: ${operation} took ${duration}ms`, metadata)
  }
}

// Database query timing
export function createQueryTimer() {
  const start = Date.now()
  return {
    end: (operation: string, metadata?: Record<string, any>) => {
      const duration = Date.now() - start
      logServerPerformance(`db:${operation}`, duration, metadata)
      return duration
    },
  }
}