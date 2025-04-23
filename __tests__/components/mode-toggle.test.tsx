import { render, screen } from '@testing-library/react'
import { ModeToggle } from '@/components/mode-toggle'
import '@testing-library/jest-dom'

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn()
  })
}))

describe('ModeToggle', () => {
  it('renders toggle button', () => {
    render(<ModeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })
})