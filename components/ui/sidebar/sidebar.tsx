'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Icons } from "./icons"

type NavItem = {
  title: string
  href: string
  icon: keyof typeof Icons
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { title: 'Payments', href: '/payments', icon: 'TransformFilled' },
  { title: 'Analytics', href: '/analytics', icon: 'ChartPie' },
  { title: 'Products', href: '/products', icon: 'Box' },
  { title: 'Reports', href: '/reports', icon: 'ReportAnalytics' },
  { title: 'Customers', href: '/customers', icon: 'Users' },
]

const settingsNavItems: NavItem[] = [
  { title: 'Settings', href: '/settings', icon: 'Settings' },
  { title: 'Billing', href: '/billing', icon: 'BuildingBank' },
  { title: 'Notifications', href: '/notifications', icon: 'Bell' },
]

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleResize = () => {
      const newCollapsed = window.innerWidth < 768
      setCollapsed(newCollapsed)
      if (onCollapse) {
        onCollapse(newCollapsed)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [onCollapse])

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    if (onCollapse) {
      onCollapse(newCollapsed)
    }
  }

  return (
    <motion.nav
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out rounded-3xl overflow-hidden",
        collapsed ? "w-20" : "w-64"
      )}
      animate={{ width: collapsed ? 80 : 256 }}
    >
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="font-bold"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                Astra
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="rounded-full"
        >
          <Icons.panelLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 mb-4">
        <div className="relative">
          <Icons.search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            type="search"
            placeholder={collapsed ? "" : "Search..."}
            className="pl-8 rounded-full"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavSection title="Main" items={mainNavItems} collapsed={collapsed} />
        <NavSection title="Settings" items={settingsNavItems} collapsed={collapsed} />
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="/avatars/01.png" alt="Joe Doe" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <p className="text-sm font-medium">Joe Doe</p>
                <p className="text-xs text-sidebar-foreground/70">joe.doe@example.com</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  )
}

function NavSection({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  return (
    <div className="mb-4">
      <AnimatePresence>
        {!collapsed && (
          <motion.h2
            className="px-4 text-xs font-semibold uppercase text-sidebar-foreground/70"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {title}
          </motion.h2>
        )}
      </AnimatePresence>
      <ul className="space-y-1 px-2">
        {items.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </ul>
    </div>
  )
}

function NavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const active = pathname === item.href
  const Icon = Icons[item.icon]

  return (
    <li>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center space-x-2 rounded-full px-3 py-2 text-sm font-medium hover:bg-sidebar-hover transition-all duration-200 ease-in-out",
                active ? "bg-sidebar-active text-sidebar-active-foreground" : "text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-grow"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </li>
  )
}

export default Sidebar;

