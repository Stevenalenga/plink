"use client"

import { UserSearchComponent } from "@/components/UserSearchComponent"

export default function SearchPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Search Users</h1>
      <p className="text-muted-foreground mb-8">
        Find other users to connect with and view their public or shared locations
      </p>
      
      <UserSearchComponent />
    </div>
  )
}