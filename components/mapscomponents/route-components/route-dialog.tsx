"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { FollowerSelector } from "@/components/FollowerSelector"
import { RouteWaypoint } from "@/types"
import { X, MapPin, Route as RouteIcon } from "lucide-react"

interface RouteDialogProps {
  open: boolean
  routeName: string
  routeDescription: string
  routeUrl?: string
  visibility: "public" | "followers" | "private"
  waypoints: RouteWaypoint[]
  distance?: number
  estimatedDuration?: number
  setRouteName: (v: string) => void
  setRouteDescription: (v: string) => void
  setRouteUrl?: (v: string) => void
  setVisibility: (v: "public" | "followers" | "private") => void
  onCancel: () => void
  onSave: (
    validatedUrl: string | null,
    expiresAt?: string | null,
    selectedFollowers?: string[]
  ) => void
}

export function RouteDialog({
  open,
  routeName,
  routeDescription,
  routeUrl,
  visibility,
  waypoints,
  distance,
  estimatedDuration,
  setRouteName,
  setRouteDescription,
  setRouteUrl,
  setVisibility,
  onCancel,
  onSave,
}: RouteDialogProps) {
  const [url, setUrl] = useState(routeUrl || "")
  const [expirationOption, setExpirationOption] = useState<'24h' | 'never' | 'custom'>('never')
  const [customHours, setCustomHours] = useState<number>(24)
  const [useSelectiveSharing, setUseSelectiveSharing] = useState(false)
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([])
  const { toast } = useToast()

  const handleSave = () => {
    if (!routeName.trim()) {
      toast({
        title: "Route name is required",
        variant: "destructive",
      })
      return
    }

    if (waypoints.length < 2) {
      toast({
        title: "At least 2 waypoints required",
        description: "A route must have at least 2 waypoints",
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

    // Update parent's routeUrl state if setRouteUrl function is provided
    if (setRouteUrl) {
      setRouteUrl(validatedUrl || "")
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
    
    // Call onSave with the validated URL, expiration, and selected followers
    const followersToShare = visibility === 'followers' && useSelectiveSharing ? selectedFollowers : undefined
    onSave(validatedUrl || null, expiresAt, followersToShare)
  }

  // Sync local URL state when parent URL changes
  useEffect(() => {
    if (routeUrl !== undefined) {
      setUrl(routeUrl || "")
    }
  }, [routeUrl])

  // Format distance for display
  const formatDistance = (meters?: number) => {
    if (!meters) return "N/A"
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  // Format duration for display
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <Dialog
      open={open}
      modal={true}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-background text-foreground border border-border p-4 z-[2147483647] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-auto shadow-xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader className="pb-2">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Save Route
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-2">
          {/* Route Summary */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Waypoints</div>
              <div className="text-lg font-semibold flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {waypoints.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Distance</div>
              <div className="text-lg font-semibold">{formatDistance(distance)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Est. Duration</div>
              <div className="text-lg font-semibold">{formatDuration(estimatedDuration)}</div>
            </div>
          </div>

          {/* Route Name */}
          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name *</Label>
            <Input
              id="route-name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g., Morning Jog Route, City Tour"
            />
          </div>

          {/* Route Description */}
          <div className="space-y-2">
            <Label htmlFor="route-description">Description (Optional)</Label>
            <Textarea
              id="route-description"
              value={routeDescription}
              onChange={(e) => setRouteDescription(e.target.value)}
              placeholder="Add details about this route..."
              rows={3}
            />
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="route-url">
              Link / URL (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                e.g., https://example.com or /profile/user
              </span>
            </Label>
            <Input
              id="route-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or /profile/user123"
            />
          </div>

          {/* Visibility Settings */}
          <div className="space-y-3">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="public" id="route-public" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="route-public" className="font-medium cursor-pointer">
                    Public
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Anyone can view this route
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="followers" id="route-followers" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="route-followers" className="font-medium cursor-pointer">
                    Followers Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only your followers can view this route
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="private" id="route-private" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="route-private" className="font-medium cursor-pointer">
                    Private
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only you can view this route
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Selective Follower Sharing */}
          {visibility === 'followers' && (
            <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selective-sharing"
                  checked={useSelectiveSharing}
                  onCheckedChange={(checked) => {
                    setUseSelectiveSharing(checked === true)
                    if (!checked) setSelectedFollowers([])
                  }}
                />
                <Label htmlFor="selective-sharing" className="cursor-pointer text-sm">
                  Share with specific followers only
                </Label>
              </div>
              {useSelectiveSharing && (
                <FollowerSelector
                  selectedFollowers={selectedFollowers}
                  onSelectionChange={setSelectedFollowers}
                />
              )}
            </div>
          )}

          {/* Expiration Settings */}
          <div className="space-y-3">
            <Label>Route Expiration</Label>
            <RadioGroup value={expirationOption} onValueChange={(v) => setExpirationOption(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="route-never" />
                <Label htmlFor="route-never" className="cursor-pointer">Never expire</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24h" id="route-24h" />
                <Label htmlFor="route-24h" className="cursor-pointer">Expire in 24 hours</Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="custom" id="route-custom" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="route-custom" className="cursor-pointer">Custom expiration</Label>
                  {expirationOption === 'custom' && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="8760"
                        value={customHours}
                        onChange={(e) => setCustomHours(parseInt(e.target.value) || 24)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">hours</span>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Save Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
