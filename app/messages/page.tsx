"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Search, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: string
  sender: string
  content: string
  timestamp: Date
  read: boolean
}

export default function MessagesInbox() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "Alice", content: "Hey! How's it going?", timestamp: new Date(2023, 5, 1, 14, 30), read: false },
    { id: "2", sender: "Bob", content: "Did you see the latest project update?", timestamp: new Date(2023, 5, 1, 10, 15), read: true },
    { id: "3", sender: "Charlie", content: "Lunch meeting today?", timestamp: new Date(2023, 4, 31, 18, 45), read: false },
    { id: "4", sender: "David", content: "Great job on the presentation!", timestamp: new Date(2023, 4, 31, 11, 20), read: true },
    { id: "5", sender: "Eve", content: "Can we reschedule our call?", timestamp: new Date(2023, 4, 30, 9, 0), read: true },
  ])

  const [searchQuery, setSearchQuery] = useState("")

  const filteredMessages = messages.filter(message => 
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMessageClick = (id: string) => {
    router.push(`/messages/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold flex items-center">
              <MessageCircle className="mr-2 h-8 w-8" />
              Messages
            </h1>
            <Button onClick={() => router.push('/messages/new')}>New Message</Button>
          </div>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <ScrollArea className="h-[calc(100vh-250px)]">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No messages found
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredMessages.map((message) => (
                  <li 
                    key={message.id}
                    onClick={() => handleMessageClick(message.id)}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all duration-300 ease-in-out transform hover:scale-102 cursor-pointer ${
                      message.read ? 'opacity-60' : 'shadow-md'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.sender}`} />
                        <AvatarFallback>{message.sender[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{message.sender}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{message.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(message.timestamp, "MMM d, h:mm a")}
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