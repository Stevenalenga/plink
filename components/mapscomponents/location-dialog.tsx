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
  onSave: (validatedUrl: string | null) => void
  lat?: number | null
  lng?: number | null
  setLat?: (v: number | null) => void
  setLng?: (v: number | null) => void
}) {
  const [url, setUrl] = useState(locationUrl || "")
  const [expirationOption, setExpirationOption] = useState<'24h' | 'never' | 'custom'>('24h')
  const [customHours, setCustomHours] = useState<number>(24)
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

  // Add logging to see when component renders
  console.log("LocationDialog rendering, open state:", open);

  return (
    <Dialog
      open={open}
      modal={true}
      onOpenChange={(next) => {
        console.log("Dialog open state changing to:", next);
        // Only propagate close to parent; never force-open from inside
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-background text-foreground border border-border p-4 z-[2147483647] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-auto shadow-xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader className="pb-2">
          <DialogTitle className="text-foreground">Add Location by Coordinates</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url" className="text-foreground">
              Link (Optional)
            </Label>
            <div className="text-xs text-muted-foreground">
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
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
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

          <div className="flex flex-col gap-1.5 pt-1">
            <Label htmlFor="visibility" className="text-foreground">
              Visibility
            </Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="z-[2147483647] max-h-[40vh] overflow-y-auto">
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Private (only you)</span>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span>Followers only</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Public (everyone)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Expiration settings - only show for public locations */}
            {visibility === 'public' && (
              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="expiration" className="text-foreground">
                  Auto-Delete After
                </Label>
                <Select value={expirationOption} onValueChange={(v) => setExpirationOption(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="z-[2147483647]">
                    <SelectItem value="24h">24 hours (Recommended)</SelectItem>
                    <SelectItem value="custom">Custom duration</SelectItem>
                    <SelectItem value="never">Never expire</SelectItem>
                  </SelectContent>
                </Select>
                
                {expirationOption === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="720"
                      value={customHours}
                      onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-background text-foreground border-border"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                )}
                
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">Privacy Notice</p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      {expirationOption === 'never' 
                        ? 'Public locations without expiration will remain visible indefinitely. Consider setting an expiration for better privacy.'
                        : expirationOption === '24h'
                        ? 'Location will be automatically deleted after 24 hours for privacy and security.'
                        : `Location will be automatically deleted after ${customHours} hour${customHours !== 1 ? 's' : ''}.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel"
            className="border-border text-foreground bg-transparent"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            aria-label="Save Location" 
            className="text-foreground"
            disabled={!locationName.trim()}
          >
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
