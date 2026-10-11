'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body>
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Terjadi Kesalahan Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Maaf, terjadi kesalahan pada server. Tim kami telah diberitahu.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Digest: {error.digest}
              </p>
              <Button
                onClick={reset}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </CardContent>
            <CardFooter>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}