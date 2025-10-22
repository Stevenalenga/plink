"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { FollowerSelector } from "@/components/FollowerSelector"
import { SavedRoute } from "@/types"
import { MapPin, Route as RouteIcon } from "lucide-react"

interface RouteEditDialogProps {
  isOpen: boolean
  route: SavedRoute | null
  onClose: () => void
  onSave: (updatedData: {
    name: string
    description?: string
    url?: string
    visibility: 'public' | 'followers' | 'private'
    expires_at?: string | null
    selectedFollowers?: string[]
  }) => void
}

export function RouteEditDialog({
  isOpen,
  route,
  onClose,
  onSave,
}: RouteEditDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [url, setUrl] = useState("")
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>("private")
  const [expirationOption, setExpirationOption] = useState<'24h' | 'never' | 'custom'>('never')
  const [customHours, setCustomHours] = useState<number>(24)
  const [useSelectiveSharing, setUseSelectiveSharing] = useState(false)
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && route) {
      setName(route.name || "")
      setDescription(route.description || "")
      setUrl(route.url || "")
      setVisibility(route.visibility as any)

      // Set expiration option based on route data
      if (route.expires_at) {
        const expiresAt = new Date(route.expires_at)
        const now = new Date()
        const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (Math.abs(hoursUntilExpiry - 24) < 1) {
          setExpirationOption('24h')
        } else {
          setExpirationOption('custom')
          setCustomHours(Math.max(1, Math.round(hoursUntilExpiry)))
        }
      } else {
        setExpirationOption('never')
      }

      // Reset selective sharing state
      setUseSelectiveSharing(false)
      setSelectedFollowers([])
    }
  }, [isOpen, route])

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Route name is required",
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

    const updatedData = {
      name: name.trim(),
      description: description.trim(),
      visibility,
      url: validatedUrl || null,
      expires_at: expiresAt,
      selectedFollowers: visibility === 'followers' && useSelectiveSharing ? selectedFollowers : undefined,
    }

    onSave(updatedData)
    onClose()
  }

  if (!isOpen || !route) return null

  // Format distance for display
  const formatDistance = (meters?: number | null) => {
    if (!meters) return "N/A"
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  // Format duration for display
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Edit Route
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Route Summary */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Waypoints</div>
              <div className="text-lg font-semibold flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4" />
                {route.points?.length || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Distance</div>
              <div className="text-lg font-semibold">{formatDistance(route.distance)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Est. Duration</div>
              <div className="text-lg font-semibold">{formatDuration(route.estimated_duration)}</div>
            </div>
          </div>

          {/* Route Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-route-name">Route Name *</Label>
            <Input
              id="edit-route-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter route name"
            />
          </div>

          {/* Route Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-route-description">Description (Optional)</Label>
            <Textarea
              id="edit-route-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this route..."
              rows={3}
            />
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-route-url">
              Link / URL (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                e.g., https://example.com or /profile/user
              </span>
            </Label>
            <Input
              id="edit-route-url"
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
                <RadioGroupItem value="public" id="edit-route-public" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-route-public" className="font-medium cursor-pointer">
                    Public
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Anyone can view this route
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="followers" id="edit-route-followers" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-route-followers" className="font-medium cursor-pointer">
                    Followers Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only your followers can view this route
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="private" id="edit-route-private" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="edit-route-private" className="font-medium cursor-pointer">
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
                  id="edit-selective-sharing"
                  checked={useSelectiveSharing}
                  onCheckedChange={(checked) => {
                    setUseSelectiveSharing(checked === true)
                    if (!checked) setSelectedFollowers([])
                  }}
                />
                <Label htmlFor="edit-selective-sharing" className="cursor-pointer text-sm">
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
                <RadioGroupItem value="never" id="edit-route-never" />
                <Label htmlFor="edit-route-never" className="cursor-pointer">Never expire</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24h" id="edit-route-24h" />
                <Label htmlFor="edit-route-24h" className="cursor-pointer">Expire in 24 hours</Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="custom" id="edit-route-custom" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="edit-route-custom" className="cursor-pointer">Custom expiration</Label>
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
