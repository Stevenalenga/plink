import Link from 'next/link';
import { useState } from 'react';
import { SavedLocation } from '../../app/maps/locations/savedLocations';

interface HeaderProps {
  savedLocations: SavedLocation[];
}

export function Header({ savedLocations }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          My Maps
        </Link>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            Saved Locations
          </button>
          {isOpen && (
            <ul className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg">
              {savedLocations.map((location, index) => (
                <li key={index}>
                  <Link
                    href={`/maps?lat=${location.lat}&lng=${location.lng}&name=${encodeURIComponent(location.name)}`}
                    className="block px-4 py-2 hover:bg-gray-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </header>
  );
}
