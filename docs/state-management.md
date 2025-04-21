# State Management

## Authentication State

Authentication state is managed globally using React Context:

\`\`\`typescript
// components/user-provider.tsx
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize and listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Auth functions and context value...
}
\`\`\`

## Map State

Map state is managed locally within the MapContainer component:

\`\`\`typescript
// components/map-container.tsx
export function MapContainer() {
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  // Other state variables...
  
  // Map initialization, marker management, etc.
}
\`\`\`

## Component State

Individual components manage their own state for UI interactions:

\`\`\`typescript
// components/search-bar.tsx
export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  // Search handling logic...
}
\`\`\`

## Data Fetching

Data is fetched from Supabase using hooks and effects:

\`\`\`typescript
// app/profile/page.tsx
useEffect(() => {
  const fetchUserData = async () => {
    if (!user) return
    
    try {
      // Fetch user's locations
      const { data: locationData } = await supabase
        .from("locations")
        .select("*")
        .eq("user_id", user.id)
        
      setLocations(locationData || [])
      
      // Fetch other data...
    } catch (error) {
      // Error handling...
    }
  }
  
  if (user) {
    fetchUserData()
  }
}, [user])
