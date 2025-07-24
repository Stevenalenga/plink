import { Button } from "@/components/ui/button"
import { RouteIcon, Share2, Plus } from "lucide-react"
import React from "react"

export function FabButtons({
  onAdd,
  onRoutes,
  onExplore,
}: {
  onAdd: () => void
  onRoutes: () => void
  onExplore: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button size="icon" className="rounded-full shadow-lg" onClick={onAdd}>
        <Plus className="h-5 w-5" />
      </Button>
      <Button size="icon" variant="outline" className="rounded-full shadow-lg" onClick={onRoutes}>
        <RouteIcon className="h-5 w-5" />
      </Button>
      <Button size="icon" variant="outline" className="rounded-full shadow-lg" onClick={onExplore}>
        <Share2 className="h-5 w-5" />
      </Button>
    </div>
  )
}
