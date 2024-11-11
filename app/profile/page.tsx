"use client"

import React from "react"
import { MapPin, Route, Clock, Settings, Grid, Bookmark, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function ProfilePage() {
  const user = {
    name: "Jane Doe",
    username: "jane_explorer",
    avatar: "https://api.dicebear.com/6.x/adventurer/svg?seed=Jane",
    bio: "Adventure seeker | Map enthusiast | 🌍 Exploring the world one pin at a time",
    level: 7,
    xp: 2800,
    nextLevelXp: 5000,
    placesVisited: 143,
    routesCreated: 28,
    favoritePlaces: 52,
    totalDistance: 1287,
    memberSince: "2021",
    posts: 75,
    followers: 1234,
    following: 567,
  }

  const recentActivity = [
    { image: "/placeholder.svg?height=300&width=300", place: "Eiffel Tower, Paris", date: "2 days ago" },
    { image: "/placeholder.svg?height=300&width=300", place: "Central Park, New York", date: "1 week ago" },
    { image: "/placeholder.svg?height=300&width=300", place: "Sagrada Familia, Barcelona", date: "2 weeks ago" },
    { image: "/placeholder.svg?height=300&width=300", place: "Colosseum, Rome", date: "3 weeks ago" },
    { image: "/placeholder.svg?height=300&width=300", place: "Great Wall, China", date: "1 month ago" },
    { image: "/placeholder.svg?height=300&width=300", place: "Machu Picchu, Peru", date: "1 month ago" },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 mb-4 md:mb-0 md:mr-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-col md:flex-row md:items-center mb-4">
              <h1 className="text-2xl font-semibold mr-4">{user.username}</h1>
              <div className="mt-2 md:mt-0">
                <Button className="mr-2">Follow</Button>
                <Button variant="outline">Message</Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-start space-x-8 mb-4">
              <span><strong>{user.posts}</strong> posts</span>
              <span><strong>{user.followers}</strong> followers</span>
              <span><strong>{user.following}</strong> following</span>
            </div>
            <p className="font-semibold">{user.name}</p>
            <p className="mt-2">{user.bio}</p>
          </div>
        </div>

        {/* Map Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <MapPin className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-lg font-semibold">{user.placesVisited}</span>
              <span className="text-sm text-gray-500">Places Visited</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Route className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-lg font-semibold">{user.routesCreated}</span>
              <span className="text-sm text-gray-500">Routes Created</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Bookmark className="h-8 w-8 text-yellow-500 mb-2" />
              <span className="text-lg font-semibold">{user.favoritePlaces}</span>
              <span className="text-sm text-gray-500">Favorite Places</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4">
              <Clock className="h-8 w-8 text-purple-500 mb-2" />
              <span className="text-lg font-semibold">{user.memberSince}</span>
              <span className="text-sm text-gray-500">Member Since</span>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Level {user.level} Explorer</span>
              <span className="text-sm text-gray-500">{user.xp} / {user.nextLevelXp} XP</span>
            </div>
            <Progress value={(user.xp / user.nextLevelXp) * 100} className="w-full" />
          </CardContent>
        </Card>

        {/* Tabs and Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts"><Grid className="h-5 w-5 mr-2" /> Posts</TabsTrigger>
            <TabsTrigger value="saved"><Bookmark className="h-5 w-5 mr-2" /> Saved</TabsTrigger>
            <TabsTrigger value="tagged"><User className="h-5 w-5 mr-2" /> Tagged</TabsTrigger>
          </TabsList>
          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-1 mt-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={activity.image} alt={activity.place} className="object-cover w-full h-full" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    <p className="truncate">{activity.place}</p>
                    <p className="text-xs">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="saved">
            <div className="text-center py-8 text-gray-500">No saved places yet.</div>
          </TabsContent>
          <TabsContent value="tagged">
            <div className="text-center py-8 text-gray-500">No tagged places yet.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}