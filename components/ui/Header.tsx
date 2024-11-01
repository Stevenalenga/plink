
import Link from 'next/link'
import { User, Settings, MessageSquare, Bell } from 'lucide-react'
import { SavedLocation } from '../../app/maps/locations/savedLocations'

interface HeaderProps {
  savedLocations: SavedLocation[];
}

export function Header({ savedLocations }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm p-4 w-full">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">My Maps</div>
        <div className="flex space-x-4">
          <Link href="/profile" className="flex items-center text-gray-600 hover:text-gray-900">
            <User className="w-5 h-5 mr-1" />
            <span>Profile</span>
          </Link>
          <Link href="/settings" className="flex items-center text-gray-600 hover:text-gray-900">
            <Settings className="w-5 h-5 mr-1" />
            <span>Settings</span>
          </Link>
          <Link href="/messages" className="flex items-center text-gray-600 hover:text-gray-900">
            <MessageSquare className="w-5 h-5 mr-1" />
            <span>Messages</span>
          </Link>
          <Link href="/notifications" className="flex items-center text-gray-600 hover:text-gray-900">
            <Bell className="w-5 h-5 mr-1" />
            <span className="sr-only">Notifications</span>
          </Link>
        </div>
      </nav>
      {/* Existing saved locations functionality */}
      <div className="mt-4">
        
        <ul>
          {savedLocations.map((location, index) => (
            <li key={index}>{location.name}</li>
          ))}
        </ul>
      </div>
    </header>
  );
}
