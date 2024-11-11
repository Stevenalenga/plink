"use client"

import React, { useState } from "react"
import { Bell, Check, Trash2, MessageSquare, Heart, UserPlus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Notification = {
  id: number
  type: "message" | "like" | "follow" | "mention"
  content: string
  sender: string
  time: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: "message", content: "Hey! How's it going?", sender: "Alice", time: "2m ago", read: false },
    { id: 2, type: "like", content: "liked your post", sender: "Bob", time: "5m ago", read: false },
    { id: 3, type: "follow", content: "started following you", sender: "Charlie", time: "10m ago", read: false },
    { id: 4, type: "mention", content: "mentioned you in a comment", sender: "David", time: "15m ago", read: false },
    { id: 5, type: "message", content: "Don't forget about our meeting!", sender: "Eve", time: "1h ago", read: true },
  ])

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id))
  }

  const toggleRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: !notif.read } : notif
    ))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "message": return <MessageSquare className="h-4 w-4" />
      case "like": return <Heart className="h-4 w-4" />
      case "follow": return <UserPlus className="h-4 w-4" />
      case "mention": return <Star className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex items-center">
              <Bell className="mr-2 h-8 w-8" />
              Notifications
            </h1>
            <Button onClick={markAllAsRead} variant="outline">Mark all as read</Button>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No notifications to display
              </div>
            ) : (
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all duration-300 ease-in-out transform hover:scale-102 ${
                      notification.read ? 'opacity-60' : 'shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${notification.sender}`} />
                          <AvatarFallback>{notification.sender[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">
                            {notification.sender}{' '}
                            <span className="font-normal text-gray-600 dark:text-gray-300">
                              {notification.content}
                            </span>
                          </p>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getIcon(notification.type)}
                              <span className="ml-1">{notification.type}</span>
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => toggleRead(notification.id)}
                        >
                          <Check className={`h-4 w-4 ${notification.read ? 'text-green-500' : 'text-gray-500'}`} />
                          <span className="sr-only">Mark as {notification.read ? 'unread' : 'read'}</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete notification</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}