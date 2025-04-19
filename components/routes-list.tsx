"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Route, MapPin, Heart, Share2 } from "lucide-react"

export function RoutesList() {
  const [activeTab, setActiveTab] = useState("popular")

  // Mock data
  const routes = [
    {
      id: "1",
      title: "Central Park Loop",
      description: "A scenic route through Central Park",
      distance: "2.5 miles",
      stops: 4,
      author: {
        name: "John Doe",
        avatar: null,
      },
      likes: 124,
      isPublic: true,
    },
    {
      id: "2",
      title: "Brooklyn Bridge Walk",
      description: "Cross the iconic Brooklyn Bridge",
      distance: "1.1 miles",
      stops: 2,
      author: {
        name: "Jane Smith",
        avatar: null,
      },
      likes: 89,
      isPublic: true,
    },
    {
      id: "3",
      title: "High Line Stroll",
      description: "Walk along the elevated linear park",
      distance: "1.45 miles",
      stops: 5,
      author: {
        name: "Mike Johnson",
        avatar: null,
      },
      likes: 67,
      isPublic: true,
    },
  ]

  return (
    <div>
      <Tabs defaultValue="popular" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routes.slice(1).map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routes.slice(0, 1).map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RouteCard({ route }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{route.title}</CardTitle>
            <CardDescription>{route.description}</CardDescription>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={route.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{route.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32 bg-muted rounded-md flex items-center justify-center mb-4">
          <Route className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{route.stops} stops</span>
          </div>
          <div>{route.distance}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <Heart className="h-4 w-4 mr-1" />
          {route.likes}
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/routes/${route.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
