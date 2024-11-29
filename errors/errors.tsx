'use client'

import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <WifiOff className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Oops! 😕</h1>
      <p className="text-xl text-gray-600 mb-6">It seems you're offline 📡</p>
      <p className="text-lg text-gray-500 mb-8 text-center">
        Don't worry, it happens to the best of us! 😅<br />
        <br />
        Check your internet connection and try again.
      </p>
      <Button
        onClick={reset}
        className="group relative overflow-hidden rounded-full px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        <span className="relative z-10">Reload Page</span>
        <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-opacity" />
        <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-white/30 transition-all duration-300 group-hover:scale-100"></div>
      </Button>
    </div>
  )
}

