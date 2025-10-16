import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FollowerSelector } from "@/components/FollowerSelector"
import type { Tables } from "@/lib/supabase"

type Location = Tables["locations"]

interface LocationEditDialogProps {
  isOpen: boolean
  location: Location | null
  onClose: () => void
  onSave: (updatedData: { 
    name: string; 
    url?: string; 
    visibility: 'public' | 'followers' | 'private';
    expires_at?: string | null;
    selectedFollowers?: string[];
  }) => void
}

export function LocationEditDialog({ 
  isOpen, 
  location, 
  onClose, 
  onSave 
}: LocationEditDialogProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>("private")
  const [expirationOption, setExpirationOption] = useState<'24h' | 'never' | 'custom'>('never')
  const [customHours, setCustomHours] = useState<number>(24)
  const [useSelectiveSharing, setUseSelectiveSharing] = useState(false)
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && location) {
      setName(location.name || "")
      setUrl(location.url || "")
      setVisibility(location.visibility as any)
      
      // Set expiration option based on location data
      const locationWithExpiry = location as any
      if (locationWithExpiry.expires_at) {
        const expiresAt = new Date(locationWithExpiry.expires_at)
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
  }, [isOpen, location])

  const handleSave = () => {
    if (!name.trim()) {
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

    const updatedData = {
      name: name.trim(),
      visibility,
      url: validatedUrl || null,
      expires_at: expiresAt,
      selectedFollowers: visibility === 'followers' && useSelectiveSharing ? selectedFollowers : undefined,
    }

    onSave(updatedData)
    onClose()
  }

  if (!isOpen || !location) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter location name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-url">Link (Optional)</Label>
            <div className="text-xs text-muted-foreground">
              Add a link to a website, profile, or internal page
            </div>
            <Input
              id="location-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or /profile/user123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select 
              value={visibility} 
              onValueChange={(value) => {
                setVisibility(value as any)
                // Reset selective sharing when visibility changes
                if (value !== 'followers') {
                  setUseSelectiveSharing(false)
                  setSelectedFollowers([])
                }
              }}
            >
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private - Only you</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="public">Public - Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selective Follower Sharing */}
          {visibility === 'followers' && (
            <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="selective-sharing" className="text-base">
                    Share with specific followers
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Choose which followers can see this location
                  </div>
                </div>
                <Switch
                  id="selective-sharing"
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
                  locationId={location?.id}
                  selectedFollowers={selectedFollowers}
                  onSelectionChange={setSelectedFollowers}
                />
              )}
            </div>
          )}

          {/* Expiration settings - NOW SHOWN FOR ALL VISIBILITY TYPES */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Auto-Delete After</Label>
            <Select 
              value={expirationOption} 
              onValueChange={(value) => setExpirationOption(value as any)}
            >
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 hours (Temporary)</SelectItem>
                <SelectItem value="custom">Custom duration</SelectItem>
                <SelectItem value="never">Never expire (Permanent)</SelectItem>
              </SelectContent>
            </Select>
            
            {expirationOption === 'custom' && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min="1"
                  max="720"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours (max 720)</span>
              </div>
            )}
            
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Expiration Notice</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  {expirationOption === 'never' 
                    ? 'Location will remain until you manually delete it.'
                    : expirationOption === '24h'
                    ? 'Location will be automatically deleted after 24 hours.'
                    : `Location will be automatically deleted after ${customHours} hour${customHours !== 1 ? 's' : ''}.`
                  }
                </p>
              </div>
            </div>
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
