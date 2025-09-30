"use client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function LocationDialog({
  open,
  locationName,
  locationUrl,
  visibility,
  setLocationName,
  setLocationUrl,
  setVisibility,
  onCancel,
  onSave,
  lat,
  lng,
  setLat,
  setLng,
}: {
  open: boolean
  locationName: string
  locationUrl?: string
  visibility: "public" | "followers" | "private"
  setLocationName: (v: string) => void
  setLocationUrl?: (v: string) => void
  setVisibility: (v: "public" | "followers" | "private") => void
  onCancel: () => void
  onSave: (validatedUrl: string | null) => void // Changed to receive URL parameter
  lat?: number | null
  lng?: number | null
  setLat?: (v: number | null) => void
  setLng?: (v: number | null) => void
}) {
  const [url, setUrl] = useState(locationUrl || "")
  const { toast } = useToast()

  const handleSave = () => {
    if (!locationName.trim()) {
      toast({
        title: "Location name is required",
        variant: "destructive",
      })
      return
    }

    // Validate URL if provided
    let validatedUrl = url.trim()
    if (validatedUrl) {
      try {
        if (!validatedUrl.startsWith('http') && !validatedUrl.startsWith('/')) {
          validatedUrl = 'https://' + validatedUrl
        }
        new URL(validatedUrl.startsWith('/') ? 'https://dummy' + validatedUrl : validatedUrl)
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (e.g., https://example.com or /internal/path)",
          variant: "destructive",
        })
        return
      }
    }

    // Update parent's locationUrl state if setLocationUrl function is provided
    if (setLocationUrl) {
      setLocationUrl(validatedUrl || "")
    }
    
    // Call onSave with the validated URL directly (null if empty)
    onSave(validatedUrl || null)
  }

  // Sync local URL state when parent URL changes
  useEffect(() => {
    if (locationUrl !== undefined) {
      setUrl(locationUrl || "")
    }
  }, [locationUrl])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only propagate close to parent; never force-open from inside
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md bg-background text-foreground border border-border relative">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Location by Coordinates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-foreground">
              Location Name
            </Label>
            <Input
              id="name"
              placeholder="Enter a name for this location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              autoFocus
              className="bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>

          {/* URL Section */}
          <div className="grid gap-2">
            <Label htmlFor="url" className="text-foreground">
              Link (Optional)
            </Label>
            <div className="text-xs text-muted-foreground mb-1">
              Add a link to a website, profile, or internal page
            </div>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com or /profile/user123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>

          {/* Coordinates Section */}
          <div className="grid gap-2">
            <div className="grid gap-2">
              <Label htmlFor="latitude" className="flex justify-between text-foreground">
                <span>Latitude</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="Enter latitude (e.g., 40.7128)"
                value={lat ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  const num = v === "" ? null : Number(v)
                  if (setLat) setLat(Number.isFinite(num as number) ? (num as number) : null)
                }}
                className="bg-background text-foreground placeholder:text-muted-foreground border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude" className="flex justify-between text-foreground">
                <span>Longitude</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="Enter longitude (e.g., -74.0060)"
                value={lng ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  const num = v === "" ? null : Number(v)
                  if (setLng) setLng(Number.isFinite(num as number) ? (num as number) : null)
                }}
                className="bg-background text-foreground placeholder:text-muted-foreground border-border"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="visibility" className="text-foreground">
              Visibility
            </Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2147483647]">
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel"
            className="border-border text-foreground bg-transparent"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} aria-label="Save Location" className="text-foreground">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
