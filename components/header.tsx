"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, LogIn } from "lucide-react"
import { useUser } from "@/hooks/use-user"

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useUser()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MapSocial</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Map
          </Link>
          <Link
            href="/explore"
            className={`text-sm font-medium transition-colors ${
              pathname === "/explore" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Explore
          </Link>
          <Link
            href="/routes"
            className={`text-sm font-medium transition-colors ${
              pathname === "/routes" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Routes
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <Link href="/profile">
                  <Avatar>
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                      alt={user?.user_metadata?.name || user?.email}
                    />
                    <AvatarFallback>
                      {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
