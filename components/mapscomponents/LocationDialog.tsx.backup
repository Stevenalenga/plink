"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface LocationDialogProps {
  open: boolean
  locationName: string
  locationUrl?: string
  visibility: "public" | "followers" | "private"
  lat?: number | null
  lng?: number | null
  setLocationName: (name: string) => void
  setLocationUrl?: (url: string) => void
  setVisibility: (visibility: "public" | "followers" | "private") => void
  setLat?: (lat: number | null) => void
  setLng?: (lng: number | null) => void
  onCancel: () => void
  onSave: () => void
}

export function LocationDialog({
  open,
  locationName,
  locationUrl = "",
  visibility,
  lat,
  lng,
  setLocationName,
  setLocationUrl,
  setVisibility,
  setLat,
  setLng,
  onCancel,
  onSave,
}: LocationDialogProps) {
  const [tempUrl, setTempUrl] = useState(locationUrl)

  const handleUrlChange = (value: string) => {
    setTempUrl(value)
  }

  const handleSave = () => {
    // Update the parent with the validated URL
    if (setLocationUrl) {
      let validatedUrl = tempUrl.trim()
      if (validatedUrl) {
        // Handle internal paths (starting with /) and external URLs
        if (!validatedUrl.startsWith('http') && !validatedUrl.startsWith('/')) {
          validatedUrl = 'https://' + validatedUrl
        }
        setLocationUrl(validatedUrl)
      } else {
        setLocationUrl("")
      }
    }
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Save Location</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter a name for this location (e.g., 'Favorite Cafe')"
              className="w-full"
            />
          </div>

          {/* Coordinates Input - only show if editing is allowed */}
          {lat !== null && lng !== null && setLat && setLng && (
            <div className="space-y-2">
              <Label>Coordinates</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={lat || ""}
                    onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Latitude (-90 to 90)"
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={lng || ""}
                    onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Longitude (-180 to 180)"
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Drag the marker on the map or enter coordinates manually
              </p>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="location-url">Link (Optional)</Label>
            <Input
              id="location-url"
              type="url"
              value={tempUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com or /profile/user123"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Add a website, social profile, or internal app page link to this location
            </p>
          </div>

          {/* Visibility Select */}
          <div className="space-y-2">
            <Label htmlFor="visibility">Who can see this location?</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as any)}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Private (only you)
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Followers only
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Public (everyone)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!locationName.trim()}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}