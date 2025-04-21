"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"

interface CoordinateInputProps {
  onSaveLocation: (location: { lat: number; lng: number; name: string; isPublic: boolean }) => void
}

export function CoordinateInput({ onSaveLocation }: CoordinateInputProps) {
  const [open, setOpen] = useState(false)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [locationName, setLocationName] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [errors, setErrors] = useState<{ lat?: string; lng?: string }>({})
  const { toast } = useToast()
  const { isAuthenticated } = useUser()
  const router = useRouter()

  const validateCoordinates = (): boolean => {
    const newErrors: { lat?: string; lng?: string } = {}

    // Validate latitude (-90 to 90)
    const lat = Number.parseFloat(latitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = "Latitude must be between -90 and 90"
    }

    // Validate longitude (-180 to 180)
    const lng = Number.parseFloat(longitude)
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = "Longitude must be between -180 and 180"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to save locations",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    if (validateCoordinates()) {
      onSaveLocation({
        lat: Number.parseFloat(latitude),
        lng: Number.parseFloat(longitude),
        name: locationName || "Custom Location",
        isPublic,
      })

      // Reset form and close dialog
      setLatitude("")
      setLongitude("")
      setLocationName("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          Add by Coordinates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Location by Coordinates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              placeholder="Enter a name for this location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="latitude" className="flex justify-between">
              <span>Latitude</span>
              {errors.lat && <span className="text-destructive text-xs">{errors.lat}</span>}
            </Label>
            <Input
              id="latitude"
              placeholder="Enter latitude (e.g., 40.7128)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className={errors.lat ? "border-destructive" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="longitude" className="flex justify-between">
              <span>Longitude</span>
              {errors.lng && <span className="text-destructive text-xs">{errors.lng}</span>}
            </Label>
            <Input
              id="longitude"
              placeholder="Enter longitude (e.g., -74.0060)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className={errors.lng ? "border-destructive" : ""}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public">Make this location public</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
