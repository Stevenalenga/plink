import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Comment {
  id: string
  user: string
  avatar: string
  text: string
  date: string
}

interface LocationDetailsProps {
  name: string
  description: string
  comments: Comment[]
}

export function LocationDetails({ name, description, comments }: LocationDetailsProps) {
  return (
    <div className="w-80 border-l border-border bg-background">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2">{name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Separator className="my-4" />
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        <ScrollArea className="h-[calc(100vh-250px)]">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={comment.avatar} alt={comment.user} />
                  <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{comment.user}</p>
                  <p className="text-xs text-muted-foreground">{comment.date}</p>
                </div>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}