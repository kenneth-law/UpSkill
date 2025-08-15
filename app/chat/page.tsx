'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export default function ChatMode() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get query parameters
  const courseId = searchParams.get('courseId')
  const lessonId = searchParams.get('lessonId')
  const topic = searchParams.get('topic')
  const goals = searchParams.get('goals')

  // State variables
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [competencyScore, setCompetencyScore] = useState(0)
  const [canProgress, setCanProgress] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize the chat session
  useEffect(() => {
    if (!courseId || !topic) {
      toast({
        title: 'Missing parameters',
        description: 'Course ID and topic are required to start a chat session.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      return
    }

    // Add initial welcome message
    setMessages([{ 
      role: 'assistant', 
      content: `Hello! I'm :3, your cat tutor for today. Let's explore ${topic} together through Socratic dialogue. ${goals ? `Our goals for this session are: ${goals}. ` : ''}What would you like to learn about?` 
    }])
    setIsInitializing(false)
  }, [courseId, lessonId, topic, router, toast])

  // We've removed automatic scrolling when pressing enter as per requirements
  // Users can manually scroll to see new messages

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setInputMessage('')

    // Add user message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    setIsLoading(true)
    setIsStreaming(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          topic,
          goals,
          lessonId,
          courseId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      // Process the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      // Add an empty assistant message that will be updated as we receive chunks
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      // Switch from loading to streaming state
      setIsLoading(false)
      setIsStreaming(true)

      let fullContent = ''
      let decoder = new TextDecoder()
      let competencyScoreReceived = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode the chunk and split by newlines (each chunk may contain multiple JSON objects)
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.type === 'metadata' && !competencyScoreReceived) {
              // Handle metadata (competency score)
              competencyScoreReceived = true
              if (data.competencyScore) {
                setCompetencyScore(prevScore => {
                  const newScore = Math.min(100, prevScore + data.competencyScore)
                  // Enable progress when score reaches 100
                  if (newScore >= 100) {
                    setCanProgress(true)
                  }
                  return newScore
                })
              }
            } else if (data.type === 'content') {
              // Handle content chunk
              fullContent += data.content

              // Update the last message in the messages array
              setMessages(prev => {
                const newMessages = [...prev]
                newMessages[newMessages.length - 1] = { 
                  role: 'assistant', 
                  content: fullContent 
                }
                return newMessages
              })
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Error in stream')
            }
            // Ignore 'done' type as we'll exit the loop when reader.read() returns done=true
          } catch (e) {
            console.error('Error parsing stream chunk:', e, line)
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      })

      // Add error message to the chat
      setMessages(prev => {
        // If we already added an assistant message, update it with the error
        if (prev[prev.length - 1].role === 'assistant') {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { 
            role: 'assistant', 
            content: 'Meow? Something went wrong with my brain. Can you try asking again?' 
          }
          return newMessages
        } else {
          // Otherwise add a new error message
          return [...prev, { 
            role: 'assistant', 
            content: 'Meow? Something went wrong with my brain. Can you try asking again?' 
          }]
        }
      })
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  // Handle completing the chat session
  const handleCompleteChat = () => {
    toast({
      title: 'Chat Session Completed',
      description: 'Your chat session has been saved.',
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      {/* Moving gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 animate-gradient-xy"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold">Chat with :3 - {topic}</h1>
                <p className="text-sm opacity-80">
                  Learn through Socratic dialogue with your cat tutor
                </p>
              </div>
              <div className="bg-purple-700 px-3 py-2 rounded-lg">
                <div className="text-xs text-purple-200">Competency</div>
                <div className="text-xl font-bold">{competencyScore}/100</div>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
            {isInitializing ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div 
                      className={`inline-block rounded-lg p-3 max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-purple-100 text-gray-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4">
                    <div className="inline-block rounded-lg p-3 bg-purple-100 text-gray-800">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                {isStreaming && (
                  <div className="text-left mb-4">
                    <div className="inline-block rounded-lg p-3 bg-purple-100 text-gray-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        <span className="text-xs text-purple-500 ml-2">Streaming response...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask :3 a question..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading || isInitializing}
              />

              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg"
                disabled={!inputMessage.trim() || isLoading || isInitializing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>

          <button
            onClick={handleCompleteChat}
            className={`${canProgress 
              ? 'bg-purple-600 hover:bg-purple-700 animate-pulse' 
              : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg transition-all duration-300`}
          >
            {canProgress ? 'Progress to Next Level!' : 'Complete Chat Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
