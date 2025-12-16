"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ManualRouteInput } from "./manual-route-input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface UnifiedAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialLat?: number | null
  initialLng?: number | null
  onLocationSaved?: () => void
  onRouteCreated?: (waypoints: {lat: number, lng: number, name?: string}[]) => void
}

export function UnifiedAddDialog({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onLocationSaved,
  onRouteCreated
}: UnifiedAddDialogProps) {
  const [activeTab, setActiveTab] = useState("location")
  
  // Location form state
  const [locationName, setLocationName] = useState("")
  const [locationUrl, setLocationUrl] = useState("")
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("private")
  const [lat, setLat] = useState(initialLat || null)
  const [lng, setLng] = useState(initialLng || null)
  
  // Route form state (for manual route)
  const [showManualInput, setShowManualInput] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  const handleLocationSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: "Login required", description: "Please login to save.", variant: "destructive" })
      router.push("/login")
      return
    }

    if (!lat || !lng) {
      toast({ title: "Invalid coordinates", description: "Please enter valid latitude and longitude.", variant: "destructive" })
      return
    }

    if (!locationName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for the location.", variant: "destructive" })
      return
    }

    try {
      // Validate URL if provided
      let validatedUrl = locationUrl ? locationUrl.trim() : null
      if (validatedUrl) {
        if (!validatedUrl.startsWith('http') && !validatedUrl.startsWith('/')) {
          validatedUrl = 'https://' + validatedUrl
        }
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: locationName,
          lat,
          lng,
          visibility,
          url: validatedUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save location')
      }

      toast({
        title: "Location saved",
        description: `${locationName} has been saved`,
      })

      // Reset form
      setLocationName("")
      setLocationUrl("")
      setVisibility("private")
      setLat(null)
      setLng(null)
      onOpenChange(false)
      onLocationSaved?.()
    } catch (error: any) {
      toast({ title: "Failed to save location", description: error.message, variant: "destructive" })
    }
  }

  const handleRouteCreated = (waypoints: {lat: number, lng: number, name?: string}[]) => {
    setShowManualInput(false)
    onRouteCreated?.(waypoints)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Location or Route</DialogTitle>
          <DialogDescription>
            Save a location or create a route manually
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
          </TabsList>
          
          <TabsContent value="location" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="location-name">Name</Label>
                <Input
                  id="location-name"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter location name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={lat || ""}
                    onChange={(e) => setLat(parseFloat(e.target.value) || null)}
                    placeholder="Latitude"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={lng || ""}
                    onChange={(e) => setLng(parseFloat(e.target.value) || null)}
                    placeholder="Longitude"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="location-url">URL (optional)</Label>
                <Input
                  id="location-url"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="followers">Followers Only</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleLocationSave} className="w-full">
                Save Location
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="route" className="space-y-4">
            <ManualRouteInput
              onRouteCreated={handleRouteCreated}
              onClose={() => setShowManualInput(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}