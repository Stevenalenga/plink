import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { CoordinateInput } from '@/components/coordinate-input'
import { UserProvider } from '@/components/user-provider'
import '@testing-library/jest-dom'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } })
    }
  }
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}))

// Mock use-toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('CoordinateInput', () => {
  it('renders coordinate input field', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <CoordinateInput onSubmit={() => {}} />
        </UserProvider>
      )
    })
    
    const button = screen.getByRole('button', { name: /add by coordinates/i })
    expect(button).toBeInTheDocument()
  })
})