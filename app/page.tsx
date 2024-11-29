'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Navigation, Compass, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    console.log('Searching for:', searchQuery)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white">MyMaps</h1>
        </Link>
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
      </header>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-2">Discover a New World</h2>
        <p className="text-xl text-blue-100">Explore new places with My Maps</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md mb-8"
      >
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-white bg-opacity-20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30">
            <Search className="h-4 w-4 text-blue-200" />
            <span className="sr-only">Search</span>
          </Button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { name: 'Restaurants', icon: MapPin },
          { name: 'Hotels', icon: Navigation },
          { name: 'Attractions', icon: Compass },
          { name: 'Events', icon: Search },
        ].map((category) => (
          <motion.div
            key={category.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white bg-opacity-20 rounded-lg p-4 text-center cursor-pointer"
          >
            <category.icon className="mx-auto mb-2 text-white h-6 w-6" />
            <p className="text-white font-medium">{category.name}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Link href="/map" passHref>
          <Button
            size="lg"
            className="bg-white text-blue-600 font-bold hover:bg-blue-100 transition duration-300"
          >
            Explore Map
          </Button>
        </Link>
      </motion.div>

      <footer className="absolute bottom-0 left-0 right-0 text-center p-4 text-white text-sm">
        © 2024 MyMaps. All rights reserved.
      </footer>
    </div>
  )
}