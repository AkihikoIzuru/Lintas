import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const vitalSchema = z.object({
  name: z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number(),
  id: z.string(),
  page: z.string(),
  timestamp: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vital = vitalSchema.parse(body)

    // In production, store in database or send to analytics service
    if (process.env.NODE_ENV === 'production') {
      console.log('Web Vital:', {
        metric: vital.name,
        value: vital.value,
        rating: vital.rating,
        page: vital.page,
      })

      // TODO: Store in database or send to external analytics
      // await db.webVital.create({ data: vital })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Web Vitals error:', error)
    return NextResponse.json({ success: false }, { status: 400 })
  }
}