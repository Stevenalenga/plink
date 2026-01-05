"use client"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { FollowerSelector } from "@/components/FollowerSelector"

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
  onSave: (validatedUrl: string | null, expiresAt?: string | null, selectedFollowers?: string[], acceptsBids?: boolean) => void
  lat?: number | null
  lng?: number | null
  setLat?: (v: number | null) => void
  setLng?: (v: number | null) => void
}) {
  const [url, setUrl] = useState(locationUrl || "")
  const [expirationOption, setExpirationOption] = useState<'24h' | 'never' | 'custom'>('24h')
  const [customHours, setCustomHours] = useState<number>(24)
  const [useSelectiveSharing, setUseSelectiveSharing] = useState(false)
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([])
  const [acceptsBids, setAcceptsBids] = useState(false)
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
    
    // Calculate expires_at based on expiration option
    let expiresAt: string | null = null
    if (expirationOption === '24h') {
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + 24)
      expiresAt = expiry.toISOString()
    } else if (expirationOption === 'custom' && customHours > 0) {
      const expiry = new Date()
      expiry.setHours(expiry.getHours() + customHours)
      expiresAt = expiry.toISOString()
    }
    // If 'never', expiresAt remains null
    
    // Call onSave with the validated URL, expiration, selected followers, and accepts_bids
    const followersToShare = visibility === 'followers' && useSelectiveSharing ? selectedFollowers : undefined
    onSave(validatedUrl || null, expiresAt, followersToShare, acceptsBids)
  }

  // Sync local URL state when parent URL changes
  useEffect(() => {
    if (locationUrl !== undefined) {
      setUrl(locationUrl || "")
    }
  }, [locationUrl])

  // Enforce expiration rules based on visibility
  useEffect(() => {
    if (visibility === 'public' && expirationOption === 'never') {
      // Public locations cannot have "never expire" - default to 24h
      setExpirationOption('24h')
    }
  }, [visibility, expirationOption])

  // Add logging to see when component renders
  console.log("LocationDialog rendering, open state:", open);

  return (
    <Dialog
      open={open}
      modal={true}
      onOpenChange={(next) => {
        console.log("Dialog onOpenChange called, next value:", next);
        console.log("Current open prop:", open);
        // Allow the dialog to close normally via buttons, but log it
        if (!next) {
          console.log("Dialog closing via onOpenChange");
          onCancel()
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] bg-background text-foreground border border-border p-4 w-[90vw] md:w-auto shadow-xl pointer-events-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside the dialog
          e.preventDefault()
        }}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-foreground">Add Location by Coordinates</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto pr-2">
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
              <Select 
                value={visibility} 
                onValueChange={(value: "public" | "followers" | "private") => {
                  setVisibility(value)
                  // Reset selective sharing when visibility changes
                  if (value !== 'followers') {
                    setUseSelectiveSharing(false)
                    setSelectedFollowers([])
                  }
                  // Reset accepts bids when private (but allow for public and followers)
                  if (value === 'private') {
                    setAcceptsBids(false)
                  }
                  // Force 24h expiration for public locations
                  if (value === 'public' && expirationOption === 'never') {
                    setExpirationOption('24h')
                  }
                }}
              >
                <SelectTrigger className="w-full" id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[2147483647] max-h-[40vh] overflow-y-auto bg-popover border border-border shadow-md pointer-events-auto" sideOffset={5}>
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

              {/* Accept Bids Toggle - for public and followers locations */}
              {(visibility === 'public' || visibility === 'followers') && (
              <div className={`flex flex-col gap-2 mt-3 p-3 border rounded-lg ${
                visibility === 'public' 
                  ? 'bg-green-50 dark:bg-green-950/20' 
                  : 'bg-amber-50 dark:bg-amber-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="accepts-bids" className="text-base font-medium">
                      💰 Accept Bids
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {visibility === 'public' 
                        ? 'Allow anyone to place bids on this location'
                        : 'Allow your followers to place bids on this location'
                      }
                    </div>
                  </div>
                  <Switch
                    id="accepts-bids"
                    checked={acceptsBids}
                    onCheckedChange={setAcceptsBids}
                  />
                </div>
                {acceptsBids && (
                  <div className={`text-xs mt-1 ${
                    visibility === 'public'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    ✓ {visibility === 'public' ? 'Anyone' : 'Your followers'} can submit bids with prices. You'll see all bids after 24 hours.
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Selective Follower Sharing */}
            {visibility === 'followers' && (
              <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="selective-sharing-new" className="text-base">
                    Share with specific followers
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Choose which followers can see this location
                  </div>
                </div>
                <Switch
                  id="selective-sharing-new"
                  checked={useSelectiveSharing}
                  onCheckedChange={(checked) => {
                    setUseSelectiveSharing(checked)
                    if (!checked) {
                      setSelectedFollowers([])
                    }
                  }}
                />
              </div>

              {useSelectiveSharing && (
                <FollowerSelector
                  selectedFollowers={selectedFollowers}
                  onSelectionChange={setSelectedFollowers}
                />
                )}
              </div>
            )}

            {/* Expiration settings - NOW SHOWN FOR ALL VISIBILITY TYPES */}
            <div className="flex flex-col gap-2 mt-2">
              <Label htmlFor="expiration" className="text-foreground">
                Auto-Delete After {visibility === 'public' && <span className="text-amber-600 dark:text-amber-400 text-xs">(Required for public)</span>}
              </Label>
              
              <Select value={expirationOption} onValueChange={(v) => setExpirationOption(v as any)}>
                <SelectTrigger className="w-full" id="expiration-all">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[2147483647] bg-popover border border-border shadow-md pointer-events-auto" sideOffset={5}>
                  <SelectItem value="24h">24 hours {visibility === 'public' && '(Recommended)'}</SelectItem>
                  <SelectItem value="custom">Custom duration</SelectItem>
                  {visibility !== 'public' && (
                    <SelectItem value="never">Never expire (Permanent)</SelectItem>
                  )}
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
                  <span className="text-sm text-muted-foreground">hours (max 720)</span>
                </div>
              )}
              
              {/* Updated privacy notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {visibility === 'public' ? 'Public Location (Must Expire)' : 
                     visibility === 'followers' ? 'Followers-Only Location' : 
                     'Private Location'}
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    {visibility === 'public' 
                      ? expirationOption === '24h'
                        ? 'Public locations must expire for privacy and security. This location will be deleted after 24 hours.'
                        : `Public locations must expire for privacy. This location will be deleted after ${customHours} hour${customHours !== 1 ? 's' : ''}.`
                      : expirationOption === 'never' 
                        ? `This ${visibility} location will remain until you manually delete it.`
                        : expirationOption === '24h'
                        ? 'Location will be automatically deleted after 24 hours.'
                        : `Location will be automatically deleted after ${customHours} hour${customHours !== 1 ? 's' : ''}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-4 flex justify-end gap-2 border-t pt-4">
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
