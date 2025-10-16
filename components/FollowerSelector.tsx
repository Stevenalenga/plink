"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

interface Follower {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface FollowerSelectorProps {
  locationId?: string // If editing existing location
  selectedFollowers: string[]
  onSelectionChange: (followerIds: string[]) => void
}

export function FollowerSelector({
  locationId,
  selectedFollowers,
  onSelectionChange,
}: FollowerSelectorProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [followers, setFollowers] = useState<Follower[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Get all followers
        const { data: followersData, error } = await supabase
          .from("followers")
          .select(`
            follower_id,
            users!followers_follower_id_fkey (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq("following_id", user.id)

        if (error) throw error

        const followersList = followersData
          .map((f: any) => ({
            id: f.users.id,
            name: f.users.name || f.users.email?.split('@')[0] || 'Unknown',
            email: f.users.email,
            avatar_url: f.users.avatar_url,
          }))
          .filter((f: Follower) => f.id) // Filter out null values

        setFollowers(followersList)

        // If editing existing location, fetch current selections
        if (locationId) {
          const { data: locationFollowers, error: lfError } = await supabase
            .from("location_followers")
            .select("follower_id")
            .eq("location_id", locationId)

          if (lfError) throw lfError

          if (locationFollowers && locationFollowers.length > 0) {
            onSelectionChange(locationFollowers.map((lf) => lf.follower_id))
          }
        }
      } catch (error: any) {
        toast({
          title: "Error loading followers",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFollowers()
  }, [user, locationId, toast])

  const handleToggleFollower = (followerId: string) => {
    const newSelection = selectedFollowers.includes(followerId)
      ? selectedFollowers.filter((id) => id !== followerId)
      : [...selectedFollowers, followerId]

    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedFollowers.length === followers.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(followers.map((f) => f.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (followers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>You don't have any followers yet.</p>
        <p className="text-sm mt-2">When users follow you, you'll be able to share locations with them selectively.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Select Followers ({selectedFollowers.length} of {followers.length} selected)
        </Label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-primary hover:underline"
        >
          {selectedFollowers.length === followers.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-3">
          {followers.map((follower) => (
            <div key={follower.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent">
              <Checkbox
                id={`follower-${follower.id}`}
                checked={selectedFollowers.includes(follower.id)}
                onCheckedChange={() => handleToggleFollower(follower.id)}
              />
              <Avatar className="h-8 w-8">
                <AvatarImage src={follower.avatar_url} alt={follower.name} />
                <AvatarFallback>{follower.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <label
                htmlFor={`follower-${follower.id}`}
                className="flex-1 cursor-pointer"
              >
                <p className="text-sm font-medium">{follower.name}</p>
                <p className="text-xs text-muted-foreground">{follower.email}</p>
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">Selective Sharing</p>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            {selectedFollowers.length === 0
              ? "Select specific followers to share this location with. If none selected, all followers will see it."
              : `Only ${selectedFollowers.length} selected follower${selectedFollowers.length !== 1 ? 's' : ''} will see this location.`}
          </p>
        </div>
      </div>
    </div>
  )
}
