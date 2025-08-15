'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import VoiceInterview from '@/app/components/voice-interview'

// Client component that uses useSearchParams
function CapstoneInterviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get query parameters
  const courseId = searchParams.get('courseId')
  const lessonId = searchParams.get('lessonId')
  const topic = searchParams.get('topic')
  const interviewType = searchParams.get('type') || 'text' // Default to text

  // State variables
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Initialize the interview session
  useEffect(() => {
    if (!courseId || !topic) {
      toast({
        title: 'Missing parameters',
        description: 'Course ID and topic are required to start an interview.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      return
    }

    const initializeSession = async () => {
      try {
        setIsInitializing(true)

        const response = await fetch('/api/capstone-interview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            lessonId,
            topic,
            interviewType,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to initialize interview session')
        }

        const data = await response.json()
        setSessionId(data.sessionId)

        // For text interviews, add the initial message
        if (interviewType === 'text' && data.message) {
          setMessages([{ role: 'assistant', content: data.message }])
        }

        // For voice interviews, we'll handle the WebRTC connection separately
        if (interviewType === 'voice') {
          // This would be implemented with the OpenAI Realtime API
          // For now, we'll just show a message
          setMessages([{ 
            role: 'assistant', 
            content: 'Voice interview mode is selected. This would connect to OpenAI\'s Realtime API for speech-to-speech conversation. For this demo, please use text mode instead.' 
          }])
        }
      } catch (error) {
        console.error('Error initializing interview session:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to initialize interview session',
          variant: 'destructive',
        })
      } finally {
        setIsInitializing(false)
      }
    }

    initializeSession()
  }, [courseId, lessonId, topic, interviewType, router, toast])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return

    const userMessage = inputMessage.trim()
    setInputMessage('')

    // Add user message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    // Prepare the interview history for the API
    const interviewHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    setIsLoading(true)

    try {
      const response = await fetch('/api/capstone-interview', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          interviewHistory,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      // Add assistant response to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      })

      // Add error message to the chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error processing your response. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle voice recording (simplified implementation)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })

        // In a real implementation, you would:
        // 1. Send this audio to a speech-to-text service or directly to OpenAI's API
        // 2. Get the transcript and use it as the user's message

        // For this demo, we'll just use a placeholder
        setTranscript('This is a simulated transcript of your voice input.')
        setInputMessage('This is a simulated transcript of your voice input.')
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: 'Error',
        description: 'Failed to access microphone. Please check your permissions.',
        variant: 'destructive',
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  // Handle completing the interview
  const handleCompleteInterview = () => {
    toast({
      title: 'Interview Completed',
      description: 'Your interview has been saved.',
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {interviewType === 'voice' && !isInitializing && sessionId ? (
          // Voice Interview UI
          <>
            <VoiceInterview 
              sessionId={sessionId}
              topic={topic || 'Knowledge Synthesis'}
              systemPrompt={''}
              onComplete={handleCompleteInterview}
            />

            {/* Controls */}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          // Text Interview UI
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-600 p-4 text-white">
                <h1 className="text-xl font-semibold">Capstone Interview: {topic}</h1>
                <p className="text-sm opacity-80">
                  Demonstrate your knowledge synthesis through this {interviewType} interview
                </p>
              </div>

              {/* Chat area */}
              <div className="h-[60vh] overflow-y-auto p-4 bg-gray-50">
                {isInitializing ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="text-left mb-4">
                        <div className="inline-block rounded-lg p-3 bg-gray-200 text-gray-800">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
                    placeholder="Type your response..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    disabled={isLoading || isInitializing}
                  />

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"
                    disabled={!inputMessage.trim() || isLoading || isInitializing}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>

                {transcript && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Transcript: {transcript}</p>
                  </div>
                )}
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
                onClick={handleCompleteInterview}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Complete Interview
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Main component that wraps CapstoneInterviewContent with Suspense
export default function CapstoneInterview() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-[80vh]">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold mb-2">Loading Interview</h1>
            <p className="text-gray-600">Preparing your capstone interview session...</p>
          </div>
        </div>
      </div>
    }>
      <CapstoneInterviewContent />
    </Suspense>
  );
}
