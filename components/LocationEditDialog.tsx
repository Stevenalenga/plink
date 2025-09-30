import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { Tables } from "@/lib/supabase"

type Location = Tables["locations"]

interface LocationEditDialogProps {
  isOpen: boolean
  location: Location | null
  onClose: () => void
  onSave: (updatedData: { 
    name: string; 
    url?: string; 
    visibility: 'public' | 'followers' | 'private' 
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
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && location) {
      setName(location.name || "")
      setUrl(location.url || "")
      setVisibility(location.visibility as any)
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

    // Prepare the data to save
    const updatedData = {
      name: name.trim(),
      visibility,
      // Make sure to always include the url field, even if empty
      url: validatedUrl || null  // Use null for empty strings to match database expectation
    }

    onSave(updatedData)
    onClose()
  }

  if (!isOpen || !location) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
            <Select value={visibility} onValueChange={(value) => setVisibility(value as any)}>
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
