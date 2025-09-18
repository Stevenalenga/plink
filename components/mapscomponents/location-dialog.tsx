"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function LocationDialog({
  open,
  locationName,
  visibility,
  setLocationName,
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
  visibility: "public" | "followers" | "private"
  setLocationName: (v: string) => void
  setVisibility: (v: "public" | "followers" | "private") => void
  onCancel: () => void
  onSave: () => void
  lat?: number | null
  lng?: number | null
  setLat?: (v: number | null) => void
  setLng?: (v: number | null) => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only propagate close to parent; never force-open from inside
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md bg-background text-foreground border border-border">
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
          <Button onClick={onSave} aria-label="Save Location" className="text-foreground">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
