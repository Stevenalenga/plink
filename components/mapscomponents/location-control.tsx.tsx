"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface LocationControlProps {
  onToggle: (enabled: boolean) => void
  className?: string
}

export function LocationControl({ onToggle, className = "" }: LocationControlProps) {
  const [isEnabled, setIsEnabled] = useState(false)

  const handleToggle = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    onToggle(newState)
  }

  return (
    <Button
      onClick={handleToggle}
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      className={`${className} ${isEnabled ? "bg-blue-600 hover:bg-blue-700" : ""} px-2`}
      title={isEnabled ? "Stop tracking location" : "Track my location"}
    >
      <svg
        className="w-4 h-4 mr-1.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-xs">{isEnabled ? "Stop" : "Track"}</span>
    </Button>
  )
}
