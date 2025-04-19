"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MapPin, Heart, Share2, Search } from "lucide-react"

export function ExploreLocations() {
  const [activeTab, setActiveTab] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data
  const locations = [
    {
      id: "1",
      title: "Empire State Building",
      description: "Iconic skyscraper in Midtown Manhattan",
      address: "20 W 34th St, New York, NY 10001",
      author: {
        name: "John Doe",
        avatar: null,
      },
      likes: 245,
      isPublic: true,
    },
    {
      id: "2",
      title: "Central Park",
      description: "Urban park in Manhattan",
      address: "New York, NY",
      author: {
        name: "Jane Smith",
        avatar: null,
      },
      likes: 189,
      isPublic: true,
    },
    {
      id: "3",
      title: "Brooklyn Bridge",
      description: "Historic bridge connecting Manhattan and Brooklyn",
      address: "Brooklyn Bridge, New York, NY 10038",
      author: {
        name: "Mike Johnson",
        avatar: null,
      },
      likes: 132,
      isPublic: true,
    },
    {
      id: "4",
      title: "Times Square",
      description: "Major commercial intersection and tourist destination",
      address: "Manhattan, NY 10036",
      author: {
        name: "Sarah Williams",
        avatar: null,
      },
      likes: 98,
      isPublic: true,
    },
  ]

  const filteredLocations = locations.filter(
    (location) =>
      location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="popular" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="nearby">Nearby</TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.slice(1, 3).map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nearby" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.slice(2).map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LocationCard({ location }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{location.title}</CardTitle>
            <CardDescription>{location.description}</CardDescription>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={location.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{location.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32 bg-muted rounded-md flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">{location.address}</div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <Heart className="h-4 w-4 mr-1" />
          {location.likes}
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}
