'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Info, Mail, Menu, X } from 'lucide-react'
import Link from 'next/link'
import Draggable from 'react-draggable'


const navItems = [
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Info, label: 'About', href: '/about' },
  { icon: Mail, label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<number | null>(null)

  return (
    <Draggable bounds="parent">
      <nav className="absolute z-50 cursor-move">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 bg-primary rounded-lg overflow-hidden shadow-lg"
            >
              {navItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => setActiveItem(activeItem === index ? null : index)}
                  className="flex items-center w-full p-3 text-primary-foreground hover:bg-primary-dark transition-colors"
                >
                  <item.icon size={20} className="mr-2" />
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeItem !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 bg-background rounded-lg overflow-hidden shadow-lg"
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{navItems[activeItem].label}</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href={navItems[activeItem].href} className="text-primary hover:underline">
                      Go to {navItems[activeItem].label}
                    </Link>
                  </li>
                  {/* Add more links as needed */}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary-dark text-primary-foreground p-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
    </Draggable>
  )
}
