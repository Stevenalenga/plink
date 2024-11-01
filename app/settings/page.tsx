"use client"

import { useState } from "react"
import { Bell, ChevronRight, Globe, Key, Lock, LogOut, Moon, Palette, Shield, Sun, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account")
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter();

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "security", label: "Security", icon: Shield },
    { id: "accessibility", label: "Accessibility", icon: Users },
    { id: "connected", label: "Connected Accounts", icon: Globe },
  ]

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900 text-white" : "bg-gray-100"}`}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex space-x-2">
          <Button
              variant="outline"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => router.push('/login')}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <nav className="w-full md:w-64 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center">
                  <section.icon className="w-5 h-5 mr-3" />
                  {section.label}
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            ))}
          </nav>
          
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {activeSection === "account" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text" placeholder="Your username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {activeSection === "appearance" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Appearance Settings</h2>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-color">Theme Color</Label>
                  <Select>
                    <SelectTrigger id="theme-color">
                      <SelectValue placeholder="Select theme color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Slider
                    id="font-size"
                    min={12}
                    max={24}
                    step={1}
                    defaultValue={[16]}
                  />
                </div>
              </div>
            )}
            
            {activeSection === "notifications" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Notification Preferences</h2>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch id="email-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch id="push-notifications" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">Notification Frequency</Label>
                  <Select>
                    <SelectTrigger id="notification-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">Real-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {activeSection === "privacy" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Privacy Settings</h2>
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <RadioGroup defaultValue="public">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Private</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-collection">Allow Data Collection</Label>
                  <Switch id="data-collection" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity-status">Show Activity Status</Label>
                  <Switch id="activity-status" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="search-visibility">Appear in Search Results</Label>
                  <Switch id="search-visibility" />
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Security Settings</h2>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Change Password</Button>
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                  <Switch id="two-factor" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Recovery Email</Label>
                  <Input id="recovery-email" type="email" placeholder="backup@example.com" />
                </div>
              </div>
            )}

            {activeSection === "accessibility" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Accessibility Options</h2>
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast">High Contrast Mode</Label>
                  <Switch id="high-contrast" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-to-speech">Text-to-Speech</Label>
                  <Select>
                    <SelectTrigger id="text-to-speech">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="male">Male Voice</SelectItem>
                      <SelectItem value="female">Female Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="animation-reduce">Reduce Animations</Label>
                  <Switch id="animation-reduce" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyboard-shortcuts">Enable Keyboard Shortcuts</Label>
                  <Switch id="keyboard-shortcuts" />
                </div>
              </div>
            )}

            {activeSection === "connected" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Connected Accounts</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <Label>Google</Label>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <Label>Facebook</Label>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <Label>Twitter</Label>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <Label>GitHub</Label>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}