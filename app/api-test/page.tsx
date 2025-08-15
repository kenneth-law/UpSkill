'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Home,
  Send,
  Bot,
  RefreshCw
} from 'lucide-react'

export default function ApiTestPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      const data = await res.json()

      // Store the raw response for debugging
      setRawResponse(data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      setResponse(data.response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessage('')
    setResponse('')
    setRawResponse(null)
    setError('')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">API Test Page</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              ChatGPT API Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This page allows you to test the ChatGPT API integration. Enter a message below and click "Send" to get a response.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Textarea
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>
            </form>

            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <h3 className="font-medium mb-2">Response:</h3>
                <div className="bg-white border border-gray-200 rounded-md p-4 whitespace-pre-wrap">
                  {response}
                </div>
              </motion.div>
            )}

            {/* Display raw response data for debugging */}
            {rawResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <h3 className="font-medium mb-2">Raw Response Data (for debugging):</h3>
                <div className="bg-gray-100 border border-gray-200 rounded-md p-4 overflow-auto text-xs font-mono">
                  <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
                </div>

                {rawResponse.debug && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Debug Info:</h4>
                    <div className="bg-gray-100 border border-gray-200 rounded-md p-4">
                      <p><strong>Model:</strong> {rawResponse.debug.model}</p>
                      <p><strong>Timestamp:</strong> {rawResponse.debug.timestamp}</p>
                      <p><strong>Success:</strong> {rawResponse.debug.success ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}

                {rawResponse.details && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Error Details:</h4>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 overflow-auto text-xs font-mono">
                      <pre>{JSON.stringify(rawResponse.details, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This page tests the integration with OpenAI's API.</p>
          <p>Make sure you have set up your API keys as described in the API_SETUP.md file.</p>
        </div>
      </div>
    </main>
  )
}
