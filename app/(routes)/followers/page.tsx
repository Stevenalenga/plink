"use client"

import { useUser } from '@/hooks/use-user'
import { FollowerList } from '@/components/followers/follower-list'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function FollowersPage() {
  const { user, isAuthenticated, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router, isLoading])

  if (isLoading) {
    return <div className="container py-8">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Followers</h1>
        <FollowerList userId={user.id} type="followers" />
      </div>
    </div>
  )
}