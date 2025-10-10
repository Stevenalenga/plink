import type React from "react"
import { Header } from "@/components/header"

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {children}
    </div>
  )
}
