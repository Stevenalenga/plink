import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { UserProvider } from "@/components/user-provider"
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "MapSocial - Share and discover locations",
  description: "A social platform for sharing and discovering locations and routes",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <script async src={`https://maps.googleapis.com/maps/api/js?key=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}></script>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              {children}
            </div>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
