import Link from 'next/link'
import { Button } from "@/components/ui/button"
import AboutContent from './about-content'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu } from 'lucide-react'

export const metadata = {
  title: 'About MyMaps',
  description: 'Learn more about our mission and values at MyMaps',
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex flex-col items-center justify-center p-4">
            <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                <Link href="/" aria-label="MyMaps Home">
                    <h1 className="text-2xl font-bold text-white">MyMaps</h1>
                </Link>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" asChild className="bg-white text-green-600 hover:bg-green-100">
                      <Link href="/">Home</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link href="/about">About</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/contact">Contact</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/login">Login</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </header>

            <main>
                <AboutContent />
            </main>

            <footer className="absolute bottom-0 left-0 right-0 text-center p-4 text-white text-sm">
                © {new Date().getFullYear()} MyMaps. All rights reserved.
            </footer>
        </div>
    )
}

