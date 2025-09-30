"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Search, UserPlus, UserCheck } from "lucide-react"

type UserSearchResult = {
  id: string
  name: string | null
  avatar_url: string | null
  isFollowing: boolean
}

type UserSearchComponentProps = {
  onClose?: () => void
}

export function UserSearchComponent({ onClose }: UserSearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [followingList, setFollowingList] = useState<string[]>([])
  const { user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  // Load user's following list
  useEffect(() => {
    const loadFollowingList = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("followers")
          .select("following_id")
          .eq("follower_id", user.id)

        if (error) {
          console.error("Error loading following list in search:", error)
          return
        }

        setFollowingList((data || []).map(item => item.following_id))
      } catch (error: any) {
        console.error("Error in loadFollowingList:", error.message || error)
      }
    }

    if (user) {
      loadFollowingList()
    }
  }, [user])

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    try {
      // Search users by name with partial matching
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url")
        .ilike("name", `%${searchTerm}%`)
        .limit(10)

      if (error) throw error

      // Mark which users the current user is following
      const resultsWithFollowStatus = (data || []).map((result) => ({
        ...result,
        isFollowing: followingList.includes(result.id)
      }))

      setSearchResults(resultsWithFollowStatus)
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle follow/unfollow
  const toggleFollow = async (targetUserId: string, currentlyFollowing: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      })
      return
    }

    try {
      if (currentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .match({ follower_id: user.id, following_id: targetUserId })
          
        if (error) throw error
        
        setFollowingList(followingList.filter(id => id !== targetUserId))
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: user.id, following_id: targetUserId })
          
        if (error) throw error
        
        setFollowingList([...followingList, targetUserId])
      }

      // Update the UI
      setSearchResults(searchResults.map(result => 
        result.id === targetUserId 
          ? { ...result, isFollowing: !currentlyFollowing }
          : result
      ))

      toast({
        title: currentlyFollowing ? "Unfollowed" : "Following",
        description: currentlyFollowing ? "You are no longer following this user" : "You are now following this user",
      })
      
      // If user followed someone (not unfollowed), close the dialog
      if (!currentlyFollowing && onClose) {
        // Add a small delay before closing to allow the user to see the success message
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Navigate to user profile
  const viewProfile = (userId: string) => {
    router.push(`/users/${userId}`)
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch()
          }}
          className="flex-1"
          autoFocus
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </div>

      {searchResults.length > 0 ? (
        <div className="space-y-3">
          {searchResults.map((result) => (
            <Card key={result.id} className="p-4 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => viewProfile(result.id)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden">
                  {result.avatar_url ? (
                    <img src={result.avatar_url} alt={result.name || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <span>{result.name?.[0] || "U"}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{result.name || "Unnamed User"}</div>
                </div>
              </div>
              {user && user.id !== result.id && (
                <Button
                  variant={result.isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleFollow(result.id, result.isFollowing)}
                >
                  {result.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" /> Follow
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : searchTerm && !isLoading ? (
        <div className="text-center py-10 text-muted-foreground">
          No users found matching "{searchTerm}"
        </div>
      ) : null}
    </div>
  )
}