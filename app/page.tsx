import { Suspense } from "react"
import { Header } from "@/components/header"
import { MapContainer } from "@/components/mapscomponents/map-container"
import { MapSkeleton } from "@/components/mapscomponents/map-skeleton"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen overflow-hidden overscroll-contain">
        <div className="relative h-screen w-full">
          <div className="absolute top-4 left-4 right-20 z-10"></div>
          <Suspense fallback={<MapSkeleton />}>
            <MapContainer />
          </Suspense>
        </div>
      </main>
    </>
  )
}
