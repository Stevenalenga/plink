"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Users, UserPlus, UserCheck, Map as MapIcon } from "lucide-react"
import { formatLocation } from "@/lib/format-coordinates"
import Link from "next/link"

type ProfileUser = {
  id: string
  name: string | null
  avatar_url: string | null
}

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  visibility: 'public' | 'followers' | 'private'
  user_id: string
  url?: string | null
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const { user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const loadUserProfile = async () => {
      try {
        setLoading(true)
        
        // Fetch user info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, avatar_url")
          .eq("id", userId)
          .single()
          
        if (userError) throw userError
        if (!userData) throw new Error("User not found")
        
        setProfileUser(userData)
        
        // Check if current user is following this user
        if (user) {
          try {
            const { data: followData, error: followError } = await supabase
              .from("followers")
              .select("*")
              .match({ follower_id: user.id, following_id: userId })
              
            if (followError) {
              console.error("Error checking following status:", followError)
            } else {
              setIsFollowing(followData && followData.length > 0)
            }
          } catch (followErr) {
            console.error("Exception checking following status:", followErr)
          }
        }
        
        // Get follower counts
        try {
          const { count: followers, error: followerError } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId)
            
          if (followerError) {
            console.error("Error fetching follower count:", followerError)
          } else {
            setFollowerCount(followers || 0)
          }
          
          const { count: following, error: followingError } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId)
            
          if (followingError) {
            console.error("Error fetching following count:", followingError)
          } else {
            setFollowingCount(following || 0)
          }
        } catch (countErr) {
          console.error("Exception fetching counts:", countErr)
        }
        
        // Fetch visible locations based on visibility and follow status
        try {
          let query = supabase.from("locations").select("*").eq("user_id", userId)
          
          // If this is not the current user's profile, apply visibility filters
          if (!user || user.id !== userId) {
            if (user && isFollowing) {
              // If following, can see public and followers-only locations
              query = supabase
                .from("locations")
                .select("*")
                .eq("user_id", userId)
                .in("visibility", ["public", "followers"])
            } else {
              // Otherwise, only public locations
              query = supabase
                .from("locations")
                .select("*")
                .eq("user_id", userId)
                .eq("visibility", "public")
            }
          }
          
          const { data: locationsData, error: locationsError } = await query
          
          if (locationsError) {
            console.error("Error fetching locations:", locationsError)
          } else {
            setLocations(locationsData || [])
          }
        } catch (locErr) {
          console.error("Exception fetching locations:", locErr)
        }
        
      } catch (error: any) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error loading profile",
          description: error.message || "Failed to load user profile",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadUserProfile()
  }, [userId, user, isFollowing, toast])
  
  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      })
      router.push("/login")
      return
    }
    
    if (!profileUser) return
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .match({ follower_id: user.id, following_id: profileUser.id })
          
        if (error) throw error
        
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: user.id, following_id: profileUser.id })
          
        if (error) throw error
        
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
        
        // Reload locations since following status changed (can now see followers-only locations)
        const { data: locationsData, error: locationsError } = await supabase
          .from("locations")
          .select("*")
          .eq("user_id", profileUser.id)
          .or("visibility.eq.public,visibility.eq.followers")
          
        if (locationsError) throw locationsError
        setLocations(locationsData || [])
      }
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You are no longer following ${profileUser.name || "this user"}`
          : `You are now following ${profileUser.name || "this user"}`,
      })
      
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }
  
  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-primary animate-spin rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }
  
  if (!profileUser) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
            <CardDescription>The requested user profile does not exist</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
                  {profileUser.avatar_url ? (
                    <img src={profileUser.avatar_url} alt={profileUser.name || ""} className="h-full w-full object-cover" />
                  ) : (
                    profileUser.name?.charAt(0) || "U"
                  )}
                </div>
                <div>
                  <CardTitle>{profileUser.name || "User"}</CardTitle>
                  <CardDescription>User Profile</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{locations.length} Visible Locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{followerCount} Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span>{followingCount} Following</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {user && user.id !== profileUser.id && (
                <Button 
                  variant={isFollowing ? "outline" : "default"} 
                  className="w-full"
                  onClick={toggleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                {user && user.id === profileUser.id 
                  ? "These are your saved locations" 
                  : isFollowing
                  ? `${profileUser.name || "This user"}'s public and followers-only locations`
                  : `${profileUser.name || "This user"}'s public locations`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {user && user.id === profileUser.id 
                    ? "You haven't saved any locations yet"
                    : "No visible locations available"}
                </div>
              ) : (
                <div className="grid gap-4">
                  {locations.map((location) => (
                    <div 
                      key={location.id} 
                      className="border rounded-lg p-4 flex justify-between items-start hover:bg-accent/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{location.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            location.visibility === 'public' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : location.visibility === 'followers'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
                          }`}>
                            {location.visibility}
                          </span>
                          {location.url && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Link
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatLocation(location.lat, location.lng)}
                        </p>
                        {location.url && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                            {location.url.startsWith('http') ? location.url.replace(/^https?:\/\//, '') : location.url}
                          </p>
                        )}
                      </div>
                      <Link 
                        href={`/?lat=${location.lat}&lng=${location.lng}`}
                        className="flex-shrink-0"
                      >
                        <Button size="sm" variant="outline">
                          <MapIcon className="h-4 w-4 mr-1" /> View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}