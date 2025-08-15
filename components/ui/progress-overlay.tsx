'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ProgressOverlayProps {
  isOpen: boolean
  gameType: string
  onClose?: () => void
}

export function ProgressOverlay({ isOpen, gameType, onClose }: ProgressOverlayProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')

  // Format game type for display (e.g., "judgement-cat" -> "Judgement Cat")
  const formattedGameType = gameType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Use useMemo to memoize the messages array so it doesn't cause the effect to re-run
  const messages = React.useMemo(() => [
    `Warming up the AI engines...`,
    `Personalizing your ${formattedGameType} experience...`,
    `Crafting challenging questions just for you...`,
    `Adding a sprinkle of fun to your learning journey...`,
    `Polishing the final details...`,
    `Almost ready to boost your knowledge!`
  ], [formattedGameType])

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      return
    }

    // Reset progress when overlay opens
    setProgress(0)
    setCurrentMessage(messages[0])

    // Simulate progress with different messages at different stages
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 2, 100)

        // Update message based on progress
        if (newProgress < 20) {
          setCurrentMessage(messages[0])
        } else if (newProgress < 40) {
          setCurrentMessage(messages[1])
        } else if (newProgress < 60) {
          setCurrentMessage(messages[2])
        } else if (newProgress < 80) {
          setCurrentMessage(messages[3])
        } else if (newProgress < 95) {
          setCurrentMessage(messages[4])
        } else {
          setCurrentMessage(messages[5])
        }

        return newProgress
      })
    }, 150)

    return () => clearInterval(interval)
  }, [isOpen, messages])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Creating Your Session</h2>
              <p className="text-gray-600">
                We're preparing an amazing {formattedGameType} experience for you
              </p>
            </div>

            <div className="mb-8">
              <Progress value={progress} className="h-2 mb-4" />
              <div className="flex items-center justify-center text-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5 text-primary" />
                <p className="text-primary font-medium">{currentMessage}</p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>This may take a moment as we craft a personalized experience</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
