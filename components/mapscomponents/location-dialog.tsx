import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import React from "react"

export function LocationDialog({
  open,
  locationName,
  isPublic,
  setLocationName,
  setIsPublic,
  onCancel,
  onSave,
}: {
  open: boolean
  locationName: string
  isPublic: boolean
  setLocationName: (v: string) => void
  setIsPublic: (v: boolean) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Location</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              placeholder="Enter a name for this location"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public">Make this location public</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
