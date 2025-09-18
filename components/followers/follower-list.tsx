"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FollowButton } from './follow-button'
import { useUser } from '@/hooks/use-user'

interface FollowerListProps {
  userId: string
  type: 'followers' | 'following'
}

interface FollowUser {
  id: string
  follower_id?: string
  following_id?: string
  created_at: string
  users: {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
  }
}

export function FollowerList({ userId, type }: FollowerListProps) {
  const { user } = useUser()
  const [users, setUsers] = useState<FollowUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/followers/${userId}?type=${type}`)

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [userId, type])

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {type} yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {users.map((follow) => {
        const followUser = follow.users
        const targetId = type === 'followers' ? follow.follower_id : follow.following_id

        return (
          <Card key={follow.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={followUser.avatar_url || undefined} />
                  <AvatarFallback>
                    {followUser.name?.charAt(0) || followUser.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{followUser.name || followUser.email}</p>
                  <p className="text-sm text-muted-foreground">{followUser.email}</p>
                </div>
              </div>
              {user && targetId && user.id !== targetId && (
                <FollowButton targetUserId={targetId} />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}