"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MapPin } from "lucide-react"
import { supabase } from "@/lib/supabase" // Assuming supabase client is exported here

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get("token")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  useEffect(() => {
    if (error) {
      toast({
        title: "Reset Link Error",
        description: errorDescription || "The reset link is invalid or expired.",
        variant: "destructive",
      })
    }
  }, [error, errorDescription, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      })
      return
    }
    if (!token) {
      toast({
        title: "Invalid token",
        description: "No reset token found in the URL.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      // Verify the token and update password
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      })
      if (verifyError) throw verifyError

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })
      if (updateError) throw updateError

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset.",
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive flex items-center justify-center">
              <MapPin className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl">Reset Link Invalid</CardTitle>
            <CardDescription>The password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Request a new reset link
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-muted-foreground mt-4">
            Remember your password?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}