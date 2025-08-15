'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Send, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const [extractedText, setExtractedText] = useState<string>('')
  const [textSource, setTextSource] = useState<string>('')
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const handleTextExtracted = (text: string, source: string) => {
    setExtractedText(text)
    setTextSource(source)
    setAiResponse('')
    setError(null)
  }
  
  const sendToAI = async () => {
    if (!extractedText.trim()) {
      setError('Please upload or paste some text first')
      return
    }
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // In a real implementation, this would send the text to an AI service
      // For this example, we'll use a mock implementation
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock AI response
      const mockResponse = `I've analyzed the text from "${textSource}".
      
Here's what I found:
      
1. The text contains information about [topic detected from the content].
2. Key points include: [bullet points about the content]
3. This appears to be [type of content] material.

Would you like me to explain any specific part in more detail?`
      
      setAiResponse(mockResponse)
    } catch (error: any) {
      setError(error.message || 'Failed to process with AI')
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <ProtectedRoute>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Upload & Analyze Content</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: File upload */}
          <div>
            <FileUpload 
              onTextExtracted={handleTextExtracted} 
              isProcessing={isProcessing}
            />
          </div>
          
          {/* Right column: Extracted text and AI response */}
          <div className="space-y-6">
            {/* Extracted text card */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
                {textSource && (
                  <CardDescription>Source: {textSource}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={extractedText} 
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Extracted text will appear here..."
                  className="min-h-[200px]"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={sendToAI} 
                  disabled={!extractedText.trim() || isProcessing}
                  className="w-full flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Process with AI
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* AI Response card */}
            {aiResponse && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line">
                    {aiResponse}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Error message */}
            {error && (
              <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}