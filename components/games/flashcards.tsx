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
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

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
    <div className="w-full min-h-screen mx-auto p-6 flex flex-col">
      {/* Enhanced background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-200 animate-pulse opacity-30 z-0" />
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-50 to-indigo-100 opacity-40 z-0" />

      {/* Two-column layout with better spacing */}
      <div className="flex flex-row h-full gap-8 z-10 relative min-h-[80vh]">
        {/* Left column - Cat and Progress */}
        <div className="w-1/3 flex flex-col">
          {/* Enhanced Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-base font-medium text-gray-700 mb-3">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span className="text-indigo-600">Known: {knownCards.length}/{cards.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Enhanced Cat Avatar */}
          <motion.div
            className="text-center flex-grow flex flex-col justify-center items-center bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/30"
            animate={{
              rotate: isFlipped ? [0, 10, -10, 0] : 0,
              scale: isFlipped ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-9xl mb-6 filter drop-shadow-lg"
              animate={{
                scale: catMood === 'O.O' ? [1, 1.2, 1] : 1,
                rotate: catMood === '=^.^=' ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {catMood}
            </motion.div>
            <p className="text-lg font-medium text-gray-600 bg-white/50 px-4 py-2 rounded-lg">
              Judgement Cat is watching...
            </p>
          </motion.div>

          {/* Enhanced Music Control */}
          <div className="mt-8">
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleMusic}
              className="w-full flex items-center justify-center gap-3 bg-white/30 backdrop-blur-sm hover:bg-white/50 border border-white/30 transition-all duration-300"
            >
              {isMusicPlaying ? (
                <>
                  <Volume2 className="w-5 h-5" />
                  Pause Music
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5" />
                  Play Music
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right column - Enhanced Flashcard */}
        <div className="w-2/3 flex flex-col">
          {/* Taller Flashcard with better proportions */}
          <div className="flex-grow flex flex-col min-h-[600px]">
            <div className="relative w-full h-full perspective-1000 flex">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex"
                >
                  <Card className="w-full h-full flex flex-col shadow-2xl border-2 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/50 backdrop-blur-sm">
                    <CardContent className="flex-grow flex flex-col items-center justify-center p-12 min-h-[500px]">
                      <div className="absolute top-4 right-4 text-sm font-medium text-indigo-500 bg-indigo-100 px-3 py-1 rounded-full">
                        {isFlipped ? 'Answer' : 'Question'}
                      </div>

                      <div className="text-center w-full flex flex-col justify-center flex-grow">
                        <h3 className="text-3xl font-bold mb-6">
                          {currentCard.category && (
                            <span className="block text-lg text-indigo-600 mb-4 font-medium bg-indigo-100 px-4 py-2 rounded-lg inline-block">
                              {currentCard.category}
                            </span>
                          )}
                        </h3>
                        <div className="text-2xl leading-relaxed break-words prose prose-indigo max-w-none text-gray-800 bg-white/60 p-8 rounded-xl shadow-inner">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {isFlipped ? currentCard.back : currentCard.front}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={flipCard}
                        className="absolute bottom-6 right-6 flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium transition-all duration-300"
                      >
                        <RotateCw className="w-5 h-5" />
                        Flip Card
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Enhanced Navigation Controls */}
            <div className="mt-8 flex justify-between items-center">
              <Button
                variant="outline"
                size="lg"
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border-indigo-200 hover:bg-white/70 disabled:opacity-30 transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={markAsLearning}
                  className="px-8 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200 font-medium transition-all duration-300"
                >
                  Still Learning
                </Button>
                <Button
                  size="lg"
                  onClick={markAsKnown}
                  className="px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg transition-all duration-300"
                >
                  <Star className="w-5 h-5 mr-2" />
                  I Know This
                </Button>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={nextCard}
                className="flex items-center gap-3 bg-white/50 backdrop-blur-sm border-indigo-200 hover:bg-white/70 transition-all duration-300"
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
