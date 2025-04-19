"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

declare global {
  interface Window {
    google: any
  }
}

type PlaceResult = {
  id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlaceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize Places Service
    if (typeof window !== "undefined" && window.google && !placesService.current) {
      // Create a dummy element for the PlacesService
      const placesDiv = document.createElement("div")
      placesService.current = new window.google.maps.places.PlacesService(placesDiv)
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setResults([])

    if (!placesService.current) {
      toast({
        title: "Error",
        description: "Places service not initialized",
        variant: "destructive",
      })
      setIsSearching(false)
      return
    }

    const request = {
      query,
      fields: ["name", "geometry", "formatted_address"],
    }

    placesService.current.findPlaceFromQuery(
      request as google.maps.places.FindPlaceFromQueryRequest,
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults = results.map((place) => ({
            id: place.place_id || Math.random().toString(),
            name: place.name || "Unknown Place",
            address: place.formatted_address || "",
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
          }))
          setResults(formattedResults)
          setShowResults(true)
        } else {
          toast({
            title: "No results found",
            description: "Try a different search term",
          })
        }
        setIsSearching(false)
      },
    )
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  const selectLocation = (location: PlaceResult) => {
    // Navigate to the location on the map
    if (typeof window !== "undefined") {
      window.location.href = `/?lat=${location.location.lat}&lng=${location.location.lng}`
    }
    setShowResults(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for a location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>
      </form>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto z-10">
          <ul className="p-2">
            {results.map((result) => (
              <li
                key={result.id}
                className="px-2 py-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => selectLocation(result)}
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-muted-foreground">{result.address}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
