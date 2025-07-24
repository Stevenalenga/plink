import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import React from "react"

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  is_public: boolean
  user_id: string
}

export function SavedLocationsPanel({ markers, isLoading }: { markers: Location[]; isLoading: boolean }) {
  return (
    <Card className="w-64 shadow-lg">
      <div className="p-4">
        <h3 className="font-semibold mb-2 flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          Saved Locations
        </h3>
        <div className="max-h-48 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : markers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved locations yet</p>
          ) : (
            <ul className="space-y-2">
              {markers.map(marker => (
                <li key={marker.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">{marker.name}</span>
                  <span className={`h-2 w-2 rounded-full ${marker.is_public ? "bg-green-500" : "bg-slate-500"}`}></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}
