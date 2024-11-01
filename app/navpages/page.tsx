'use client'

import { useEffect, useState } from 'react'

interface Bubble {
  id: number
  size: 'small' | 'medium' | 'large'
  left: number
  animationDuration: number
}

export default function BubblesEffect() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])

  useEffect(() => {
    const createBubble = () => {
      const sizes = ['small', 'medium', 'large'] as const
      const newBubble: Bubble = {
        id: Date.now(),
        size: sizes[Math.floor(Math.random() * sizes.length)],
        left: Math.random() * 100,
        animationDuration: Math.random() * 4 + 2, // Between 2 and 6 seconds
      }
      setBubbles((prevBubbles) => [...prevBubbles, newBubble])

      // Remove the bubble after it reaches the top
      setTimeout(() => {
        setBubbles((prevBubbles) => prevBubbles.filter((b) => b.id !== newBubble.id))
      }, newBubble.animationDuration * 1000)
    }

    // Create initial bubbles
    for (let i = 0; i < 15; i++) {
      createBubble()
    }

    // Create new bubbles periodically
    const intervalId = setInterval(createBubble, 500)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-blue-400 to-purple-600">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className={`absolute rounded-full bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm animate-float`}
          style={{
            width: bubble.size === 'small' ? '20px' : bubble.size === 'medium' ? '40px' : '60px',
            height: bubble.size === 'small' ? '20px' : bubble.size === 'medium' ? '40px' : '60px',
            left: `${bubble.left}%`,
            animationDuration: `${bubble.animationDuration}s`,
            boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.2)',
          }}
        />
      ))}
    </div>
  )
}