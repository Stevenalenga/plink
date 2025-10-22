"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Waypoint {
  lat: number
  lng: number
  name?: string
}

interface ManualRouteInputProps {
  onRouteCreated: (waypoints: Waypoint[]) => void
  onClose: () => void
}

export function ManualRouteInput({ onRouteCreated, onClose }: ManualRouteInputProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { lat: 0, lng: 0, name: "Start" },
    { lat: 0, lng: 0, name: "End" }
  ])
  const { toast } = useToast()

  const addWaypoint = () => {
    setWaypoints(prev => [...prev, { lat: 0, lng: 0, name: `Waypoint ${prev.length - 1}` }])
  }

  const removeWaypoint = (index: number) => {
    if (waypoints.length <= 2) {
      toast({
        title: "Minimum waypoints required",
        description: "A route needs at least 2 waypoints (start and end)",
        variant: "destructive"
      })
      return
    }
    setWaypoints(prev => prev.filter((_, i) => i !== index))
  }

  const updateWaypoint = (index: number, field: keyof Waypoint, value: any) => {
    setWaypoints(prev => prev.map((wp, i) => 
      i === index ? { ...wp, [field]: value } : wp
    ))
  }

  const handleCreateRoute = () => {
    // Validate all waypoints
    const invalidWaypoints = waypoints.filter(wp => 
      !wp.lat || !wp.lng || 
      wp.lat < -90 || wp.lat > 90 || 
      wp.lng < -180 || wp.lng > 180
    )

    if (invalidWaypoints.length > 0) {
      toast({
        title: "Invalid coordinates",
        description: "Please ensure all waypoints have valid latitude (-90 to 90) and longitude (-180 to 180) values",
        variant: "destructive"
      })
      return
    }

    if (waypoints.length < 2) {
      toast({
        title: "Insufficient waypoints",
        description: "A route needs at least 2 waypoints",
        variant: "destructive"
      })
      return
    }

    onRouteCreated(waypoints)
  }

  return (
    <div className="w-full space-y-4">
        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
          {waypoints.map((wp, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-accent/50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">
                  {index === 0 ? "🟢 Start Point" : 
                   index === waypoints.length - 1 ? "🔴 End Point" : 
                   `📍 Waypoint ${index}`}
                </Label>
                {waypoints.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWaypoint(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`lat-${index}`} className="text-xs">
                    Latitude
                  </Label>
                  <Input 
                    id={`lat-${index}`}
                    placeholder="e.g., 40.7128"
                    type="number"
                    step="any"
                    value={wp.lat || ''}
                    onChange={(e) => updateWaypoint(index, 'lat', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`lng-${index}`} className="text-xs">
                    Longitude
                  </Label>
                  <Input 
                    id={`lng-${index}`}
                    placeholder="e.g., -74.0060"
                    type="number"
                    step="any"
                    value={wp.lng || ''}
                    onChange={(e) => updateWaypoint(index, 'lng', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`name-${index}`} className="text-xs">
                    Name (Optional)
                  </Label>
                  <Input 
                    id={`name-${index}`}
                    placeholder="e.g., Home"
                    value={wp.name || ''}
                    onChange={(e) => updateWaypoint(index, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={addWaypoint}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Waypoint
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRoute}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Create Route
          </Button>
        </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>Tip:</strong> Latitude ranges from -90 to 90, and Longitude ranges from -180 to 180. 
          You can find coordinates by right-clicking on Google Maps.
        </p>
      </div>
    </div>
  )
}
