'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer, Trophy, XCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

interface BoardGameProps {
  concepts: Array<{
    term: string
    definition: string
  }>
  onComplete: (score: number, timeSeconds: number) => void
}

interface BoardCard {
  id: string
  content: string
  type: 'term' | 'definition'
  conceptIndex: number
  isFlipped: boolean
  isMatched: boolean
}

export function BoardGame({ concepts, onComplete }: BoardGameProps) {
  const [cards, setCards] = useState<BoardCard[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [matches, setMatches] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [catComment, setCatComment] = useState("Let's see if you can match these. No pressure.")

  // This is a placeholder implementation - the full game will be implemented later
  useEffect(() => {
    // Initialize with mock data if no concepts provided
    const mockConcepts = concepts.length > 0 ? concepts : [
      { term: "Photosynthesis", definition: "Process by which plants convert light energy into chemical energy" },
      { term: "Mitochondria", definition: "Powerhouse of the cell" },
      { term: "Osmosis", definition: "Movement of water molecules across a semipermeable membrane" },
      { term: "Gravity", definition: "Force that attracts objects with mass toward each other" },
      { term: "Democracy", definition: "System of government by the whole population or eligible members" },
      { term: "Algorithm", definition: "Step-by-step procedure for solving a problem or accomplishing a task" }
    ]

    // Initialize cards (simplified for placeholder)
    const gameCards: BoardCard[] = []
    mockConcepts.slice(0, 6).forEach((concept, index) => {
      gameCards.push({
        id: `term-${index}`,
        content: concept.term,
        type: 'term',
        conceptIndex: index,
        isFlipped: false,
        isMatched: false
      })
      gameCards.push({
        id: `def-${index}`,
        content: concept.definition,
        type: 'definition',
        conceptIndex: index,
        isFlipped: false,
        isMatched: false
      })
    })

    // Shuffle cards
    setCards(gameCards.sort(() => Math.random() - 0.5))
    setGameStarted(true)
  }, [concepts])

  // Placeholder for the formatTime function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Placeholder for demo purposes - will be fully implemented later
  const handleCardClick = (cardId: string) => {
    console.log(`Card ${cardId} clicked - full implementation coming soon`)
  }

  return (
    <div className="w-full h-full aspect-20-9 mx-auto p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Timer className="w-6 h-6" />
          <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
        </div>
        <div className="text-center">
          <p className="text-base text-gray-600">Matches: {matches}/{cards.length / 2}</p>
        </div>
        <div className="text-right">
          <p className="text-base text-gray-600">Attempts: {attempts}</p>
        </div>
      </div>

      {/* Cat Comment */}
      <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center gap-3">
        <span className="text-3xl">:3</span>
        <p className="italic text-lg">{catComment}</p>
      </div>

      {/* Game Board - optimized for 20:9 ratio and touch */}
      <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 flex-grow">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
          >
            <Card
              className={`
                h-24 p-3 cursor-pointer transition-all
                ${card.isFlipped || card.isMatched ? 'bg-blue-50' : 'bg-white'}
                ${card.isMatched ? 'border-green-500 bg-green-50' : ''}
                hover:shadow-lg
              `}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="h-full flex items-center justify-center text-center">
                {card.isFlipped || card.isMatched ? (
                  <p className="text-sm">{card.content}</p>
                ) : (
                  <div className="text-3xl text-gray-400">?</div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Placeholder for demo completion button */}
      <div className="mt-4">
        <Button 
          onClick={() => onComplete(85, timeElapsed)} 
          className="w-full"
        >
          Complete Demo Game
        </Button>
      </div>
    </div>
  )
}