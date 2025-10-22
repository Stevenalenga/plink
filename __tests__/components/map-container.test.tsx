import { render, screen } from '@testing-library/react'
import { MapContainer } from '@/components/mapscomponents/map-container'
import '@testing-library/jest-dom'

import { useUser } from '@/hooks/use-user'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'


jest.mock('@/app/env', () => ({
    NEXT_PUBLIC_SUPABASE_URL: 'https://test-supabase-url.com',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }))

// Mock dependencies
jest.mock('@/hooks/use-user')
jest.mock('@/hooks/use-toast') 
jest.mock('next/navigation')
jest.mock('@/lib/supabase')
jest.mock('@/hooks/use-route-navigation', () => ({
  useRouteNavigation: jest.fn(() => ({
    isNavigating: false,
    currentWaypointIndex: 0,
    distanceToNextWaypoint: null,
    startNavigation: jest.fn(),
    stopNavigation: jest.fn(),
    updateUserPosition: jest.fn(),
  }))
}))

// Mock the Google Maps JavaScript API
jest.mock('@googlemaps/js-api-loader', () => ({
  Loader: jest.fn().mockImplementation(() => ({
    load: () => Promise.resolve({
      maps: {
        Map: jest.fn(),
        Marker: jest.fn(),
        InfoWindow: jest.fn(),
        LatLngBounds: jest.fn(),
        places: {
          PlacesService: jest.fn(),
          AutocompleteService: jest.fn(),
        }
      },
    }),
  })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

describe('MapContainer', () => {
  beforeEach(() => {
    // Setup default mocks
    ;(useUser as jest.Mock).mockReturnValue({ user: null, isAuthenticated: false })
    ;(useToast as jest.Mock).mockReturnValue({ toast: jest.fn() })
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<MapContainer />)
    const mapRegion = screen.getByRole('region', { name: /map container/i })
    expect(mapRegion).toBeInTheDocument()
  })

  it('initializes with loading state', () => {
    render(<MapContainer />)
    const mapRegion = screen.getByRole('region', { name: /map container/i })
    expect(mapRegion).toHaveAttribute('aria-busy', 'true')
  })

  it('does not show mode selector when not authenticated', () => {
    ;(useUser as jest.Mock).mockReturnValue({ user: null, isAuthenticated: false })
    
    render(<MapContainer />)
    
    // Mode selector should not be visible for unauthenticated users
    expect(screen.queryByText('Add Location')).not.toBeInTheDocument()
    expect(screen.queryByText('Add Route')).not.toBeInTheDocument()
  })

  it('shows mode selector when authenticated', () => {
    ;(useUser as jest.Mock).mockReturnValue({ 
      user: { id: 'test-user-id', email: 'test@example.com' }, 
      isAuthenticated: true 
    })
    
    render(<MapContainer />)
    
    // Mode selector should be visible for authenticated users
    expect(screen.getByText('Add Location')).toBeInTheDocument()
    expect(screen.getByText('Add Route')).toBeInTheDocument()
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
  })
})
