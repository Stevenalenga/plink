// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Replace this with your actual authentication check logic
    const user = localStorage.getItem('user')
    if (user) {
      setIsAuthenticated(true)
    } else {
      router.push('/login')
    }
  }, [router])

  return isAuthenticated
}
