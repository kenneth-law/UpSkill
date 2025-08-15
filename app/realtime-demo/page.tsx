'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ChatSupervisor from '@/app/components/chat-supervisor'
import SequentialHandoff from '@/app/components/sequential-handoff'
import { useToast } from '@/hooks/use-toast'

type DemoType = 'chat-supervisor' | 'sequential-handoff'

export default function RealtimeDemo() {
  const router = useRouter()
  const { toast } = useToast()
  const [demoType, setDemoType] = useState<DemoType>('chat-supervisor')
  const [topic, setTopic] = useState('Knowledge Synthesis')
  const [sessionId, setSessionId] = useState(`demo-${Math.random().toString(36).substring(2, 15)}`)

  const handleStartDemo = () => {
    if (!topic.trim()) {
      toast({
        title: 'Topic Required',
        description: 'Please enter a topic for the demo.',
        variant: 'destructive',
      })
      return
    }

    // Generate a new session ID for each demo
    setSessionId(`demo-${Math.random().toString(36).substring(2, 15)}`)
  }

  const handleComplete = () => {
    toast({
      title: 'Demo Completed',
      description: 'The demo session has ended.',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-center mb-2">Realtime API Agents Demo</h1>
          <p className="text-center text-gray-600 mb-8">
            Experience advanced patterns for voice agents using OpenAI's Realtime API
          </p>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Demo Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setDemoType('chat-supervisor')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  demoType === 'chat-supervisor'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <h3 className="text-lg font-medium mb-2">Chat-Supervisor</h3>
                <p className="text-sm text-gray-600">
                  A realtime chat agent handles basic tasks, while a more intelligent supervisor model is used for complex responses.
                </p>
              </button>

              <button
                onClick={() => setDemoType('sequential-handoff')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  demoType === 'sequential-handoff'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <h3 className="text-lg font-medium mb-2">Sequential Handoff</h3>
                <p className="text-sm text-gray-600">
                  Specialized agents transfer the user between them to handle specific user intents.
                </p>
              </button>
            </div>

            <div className="mb-6">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Enter a topic for the conversation"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Back to Dashboard
              </button>

              <button
                onClick={handleStartDemo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                Start Demo
              </button>
            </div>
          </div>

          {/* Demo Component */}
          {demoType === 'chat-supervisor' && (
            <ChatSupervisor
              sessionId={sessionId}
              topic={topic}
              systemPrompt={`You are an expert on ${topic}. Help the user understand this topic through conversation.`}
              onComplete={handleComplete}
            />
          )}

          {demoType === 'sequential-handoff' && (
            <SequentialHandoff
              sessionId={sessionId}
              topic={topic}
              onComplete={handleComplete}
            />
          )}

          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
            
            {demoType === 'chat-supervisor' && (
              <div>
                <p className="mb-4">
                  The <strong>Chat-Supervisor</strong> pattern uses a realtime-based chat agent to interact with the user and handle basic tasks, while a more intelligent, text-based supervisor model is used for tool calls and more complex responses.
                </p>
                <p className="mb-4">
                  Benefits:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Simpler onboarding if you already have a performant text-based chat agent</li>
                  <li>Gradual ramp to a full realtime agent by moving one task at a time</li>
                  <li>High intelligence from models like GPT-4.1 in your voice agents</li>
                  <li>Lower cost by using realtime-mini for basic tasks</li>
                  <li>More natural conversational experience than using a stitched model architecture</li>
                </ul>
              </div>
            )}

            {demoType === 'sequential-handoff' && (
              <div>
                <p className="mb-4">
                  The <strong>Sequential Handoffs</strong> pattern involves specialized agents transferring the user between them to handle specific user intents. Handoffs are decided by the model and coordinated via tool calls.
                </p>
                <p className="mb-4">
                  This pattern is effective for:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Customer service flows where different specialists handle different parts of the conversation</li>
                  <li>Complex workflows that require different expertise at different stages</li>
                  <li>Keeping each agent focused on a single task with specialized knowledge</li>
                  <li>Avoiding the performance degradation that comes from having all instructions and tools in a single agent</li>
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-600">
              This demo uses OpenAI's Realtime API and the OpenAI Agents SDK to create powerful, context-aware voice agents.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}