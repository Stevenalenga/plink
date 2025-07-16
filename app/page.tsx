import { Suspense } from "react"
import { MapContainer } from "@/components/mapscomponents/map-container"

import { SearchBar } from "@/components/mapscomponents/search-bar"

import { MapSkeleton } from "@/components/mapscomponents/map-skeleton"

export default function HomePage() {
  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 right-20 z-10">
          <SearchBar />
        </div>
        <Suspense fallback={<MapSkeleton />}>
          <MapContainer />
        </Suspense>
      </div>
    </main>
  )
}
