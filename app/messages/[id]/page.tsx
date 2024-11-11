"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: string
  sender: string
  content: string
  timestamp: Date
}

export default function MessageView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [message, setMessage] = useState<Message | null>(null)
  const [reply, setReply] = useState("")
  const [conversation, setConversation] = useState<Message[]>([])

  useEffect(() => {
    // In a real app, you would fetch the message and conversation from an API
    const fetchedMessage = {
      id: params.id,
      sender: "Alice",
      content: "Hey! How's it going?",
      timestamp: new Date(2023, 5, 1, 14, 30)
    }
    setMessage(fetchedMessage)

    const fetchedConversation = [
      { id: "1", sender: "Alice", content: "Hey! How's it going?", timestamp: new Date(2023, 5, 1, 14, 30) },
      { id: "2", sender: "You", content: "Hi Alice! I'm doing well, thanks. How about you?", timestamp: new Date(2023, 5, 1, 14, 35) },
      { id: "3", sender: "Alice", content: "I'm great! Just wanted to check in about the project. Any updates?", timestamp: new Date(2023, 5, 1, 14, 40) },
    ]
    setConversation(fetchedConversation)
  }, [params.id])

  const handleSendReply = () => {
    if (reply.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        sender: "You",
        content: reply,
        timestamp: new Date()
      }
      setConversation([...conversation, newMessage])
      setReply("")
    }
  }

  if (!message) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.push('/messages')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Avatar className="h-10 w-10 mr-4">
              <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.sender}`} />
              <AvatarFallback>{message.sender[0]}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">{message.sender}</h1>
          </div>
          <ScrollArea className="h-[calc(100vh-300px)] mb-4">
            <div className="space-y-4">
              {conversation.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                  }`}>
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">{format(msg.timestamp, "h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex items-end space-x-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button onClick={handleSendReply}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}