'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Volume2, 
  VolumeX,
  Star
} from 'lucide-react'

interface FlashcardItem {
  id: string
  front: string
  back: string
  category?: string
}

interface FlashcardsProps {
  cards: FlashcardItem[]
  onComplete: (score: number) => void
}

export function Flashcards({ cards, onComplete }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<string[]>([])
  const [catMood, setCatMood] = useState(':3')
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio on component mount
  useEffect(() => {
    try {
      audioRef.current = new Audio('/audio/study-music.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3

      // Add error handling for when the audio file doesn't exist
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio file not found or cannot be played', e)
        setIsMusicPlaying(false)
      })
    } catch (error) {
      console.error('Error initializing audio', error)
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Toggle music playback
  const toggleMusic = () => {
    if (!audioRef.current) return

    if (isMusicPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => {
        console.error("Audio playback failed:", e)
      })
    }
    setIsMusicPlaying(!isMusicPlaying)
  }

  // Handle card flip
  const flipCard = () => {
    setIsFlipped(!isFlipped)

    // Cat reacts to card flip
    if (!isFlipped) {
      setCatMood('O.O')
      setTimeout(() => setCatMood(':3'), 1000)
    }
  }

  // Move to next card
  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
      setProgress(((currentIndex + 1) / cards.length) * 100)
    } else {
      // Game complete
      const score = Math.round((knownCards.length / cards.length) * 100)
      onComplete(score)
    }
  }

  // Move to previous card
  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  // Mark current card as known
  const markAsKnown = () => {
    const currentCardId = cards[currentIndex].id
    if (!knownCards.includes(currentCardId)) {
      setKnownCards(prev => [...prev, currentCardId])
      setCatMood('=^.^=')
      setTimeout(() => setCatMood(':3'), 1000)
    }
    nextCard()
  }

  // Mark current card as still learning
  const markAsLearning = () => {
    setCatMood('-.-')
    setTimeout(() => setCatMood(':3'), 1000)
    nextCard()
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="w-full h-full aspect-20-9 mx-auto p-4 flex flex-col">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-100 opacity-50 z-0" />

      {/* Two-column layout */}
      <div className="flex flex-row h-full gap-6 z-10 relative">
        {/* Left column - Cat and Progress */}
        <div className="w-1/3 flex flex-col">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span>Known: {knownCards.length}/{cards.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Cat Avatar */}
          <motion.div
            className="text-center flex-grow flex flex-col justify-center items-center"
            animate={{
              rotate: isFlipped ? [0, 10, -10, 0] : 0,
              scale: isFlipped ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-8xl mb-4">{catMood}</div>
            <p className="text-lg text-gray-600">Judgement Cat is watching...</p>
          </motion.div>

          {/* Music Control */}
          <div className="mt-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMusic}
              className="w-full flex items-center justify-center gap-2"
            >
              {isMusicPlaying ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  Pause Music
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  Play Music
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right column - Flashcard */}
        <div className="w-2/3 flex flex-col">
          {/* Flashcard */}
          <div className="flex-grow flex flex-col">
            <div className="relative w-full h-full perspective-1000">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Card className="w-full h-full flex flex-col shadow-lg border-2 border-indigo-100 bg-white">
                    <CardContent className="flex-grow flex flex-col items-center justify-center p-8">
                      <div className="absolute top-2 right-2 text-xs text-gray-400">
                        {isFlipped ? 'Answer' : 'Question'}
                      </div>

                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-4">
                          {currentCard.category && (
                            <span className="block text-sm text-indigo-600 mb-2">
                              {currentCard.category}
                            </span>
                          )}
                        </h3>
                        <p className="text-xl">
                          {isFlipped ? currentCard.back : currentCard.front}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={flipCard}
                        className="absolute bottom-4 right-4 flex items-center gap-1"
                      >
                        <RotateCw className="w-4 h-4" />
                        Flip
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={markAsLearning}
                  className="px-6"
                >
                  Still Learning
                </Button>
                <Button
                  onClick={markAsKnown}
                  className="px-6 bg-green-600 hover:bg-green-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  I Know This
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={nextCard}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
