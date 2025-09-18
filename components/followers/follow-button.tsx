"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface FollowButtonProps {
  targetUserId: string
  className?: string
}

export function FollowButton({ targetUserId, className }: FollowButtonProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!user || user.id === targetUserId) return

    const checkFollowStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error
        }

        setIsFollowing(!!data)
      } catch (error: any) {
        console.error('Error checking follow status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkFollowStatus()
  }, [user, targetUserId])

  const handleFollow = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`/api/followers/${targetUserId}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to unfollow')

        setIsFollowing(false)
        toast({
          title: 'Unfollowed',
          description: 'You have unfollowed this user.',
        })
      } else {
        // Follow
        const response = await fetch('/api/followers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ followingId: targetUserId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to follow')
        }

        setIsFollowing(true)
        toast({
          title: 'Following',
          description: 'You are now following this user.',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || user.id === targetUserId) return null

  if (isChecking) {
    return (
      <Button variant="outline" disabled className={className}>
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}