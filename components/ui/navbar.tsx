'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Info, Mail, Menu, X } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Info, label: 'About', href: '/about' },
  { icon: Mail, label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<number | null>(null)

  return (
    <nav className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            className="absolute bottom-0 right-16 bg-primary rounded-full overflow-hidden flex items-center"
          >
            {navItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => setActiveItem(activeItem === index ? null : index)}
                className="p-4 text-primary-foreground hover:bg-primary-dark transition-colors"
              >
                <item.icon size={24} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeItem !== null && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="absolute bottom-16 right-0 bg-background rounded-lg overflow-hidden shadow-lg"
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
        className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  )
}

