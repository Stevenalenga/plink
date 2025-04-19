"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, RouteIcon, Settings, Share2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase"

type Location = Tables["locations"]
type Route = Tables["routes"]

export default function ProfilePage() {
  const { user, isAuthenticated, signOut, isLoading } = useUser()
  const [locations, setLocations] = useState<Location[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router, isLoading])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        setIsDataLoading(true)

        // Fetch user's locations
        const { data: locationData, error: locationError } = await supabase
          .from("locations")
          .select("*")
          .eq("user_id", user.id)

        if (locationError) throw locationError
        setLocations(locationData || [])

        // Fetch user's routes
        const { data: routeData, error: routeError } = await supabase.from("routes").select("*").eq("user_id", user.id)

        if (routeError) throw routeError
        setRoutes(routeData || [])
      } catch (error: any) {
        toast({
          title: "Error loading profile data",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsDataLoading(false)
      }
    }

    if (user) {
      fetchUserData()
    }
  }, [user, toast])

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase.from("locations").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setLocations((prev) => prev.filter((location) => location.id !== id))

      toast({
        title: "Location deleted",
        description: "The location has been removed",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting location",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteRoute = async (id: string) => {
    try {
      // Delete route points first
      const { error: pointsError } = await supabase.from("route_points").delete().eq("route_id", id)

      if (pointsError) throw pointsError

      // Then delete the route
      const { error } = await supabase.from("routes").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setRoutes((prev) => prev.filter((route) => route.id !== id))

      toast({
        title: "Route deleted",
        description: "The route has been removed",
      })
    } catch (error: any) {
      toast({
        title: "Error deleting route",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <div>
                  <CardTitle>{user?.user_metadata?.name || "User"}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{locations.length} Saved Locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{routes.length} Saved Routes</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="/profile/edit">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </a>
              </Button>
              <Button variant="destructive" className="w-full" onClick={signOut}>
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="locations">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="locations">My Locations</TabsTrigger>
              <TabsTrigger value="routes">My Routes</TabsTrigger>
            </TabsList>
            <TabsContent value="locations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Locations</CardTitle>
                  <CardDescription>Manage your saved locations</CardDescription>
                </CardHeader>
                <CardContent>
                  {isDataLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : locations.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">You haven't saved any locations yet</div>
                  ) : (
                    <div className="grid gap-4">
                      {locations.map((location) => (
                        <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{location.name}</h4>
                            <p className="text-sm text-muted-foreground">{location.is_public ? "Public" : "Private"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Center map on this location
                                router.push(`/?lat=${location.lat}&lng=${location.lng}`)
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteLocation(location.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="routes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Routes</CardTitle>
                  <CardDescription>Manage your saved routes</CardDescription>
                </CardHeader>
                <CardContent>
                  {isDataLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : routes.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">You haven't saved any routes yet</div>
                  ) : (
                    <div className="grid gap-4">
                      {routes.map((route) => (
                        <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{route.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {route.description} • {route.is_public ? "Public" : "Private"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/routes/${route.id}`)}>
                              <RouteIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteRoute(route.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
