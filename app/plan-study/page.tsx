'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { FileUpload } from '@/components/upload/file-upload'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Client component that uses useSearchParams
function PlanStudyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const topicParam = searchParams.get('topic')

  const [topic, setTopic] = useState('')
  const [frequency, setFrequency] = useState('4')
  const [duration, setDuration] = useState('15')
  const [masteryDepth, setMasteryDepth] = useState(50)
  const [studySpan, setStudySpan] = useState(30) // Default to 30 days (about a month)
  const [ageGroup, setAgeGroup] = useState('13-16') // Default age group
  const [extractedText, setExtractedText] = useState('')
  const [textSource, setTextSource] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (topicParam) {
      setTopic(topicParam)
    }
  }, [topicParam])

  const handleTextExtracted = (text: string, source: string) => {
    setExtractedText(text)
    setTextSource(source)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    // Build query parameters for the animation page
    const params = new URLSearchParams()
    params.set('topic', topic)
    params.set('frequency', frequency)
    params.set('duration', duration)
    params.set('masteryDepth', masteryDepth.toString())
    params.set('studySpan', studySpan.toString())
    params.set('courseLength', duration) // Using duration for courseLength
    params.set('ageGroup', ageGroup)

    if (extractedText) {
      params.set('extractedText', extractedText)
    }

    if (textSource) {
      params.set('textSource', textSource)
    }

    // Redirect to the animation page with the form data
    router.push(`/creating-study-plan?${params.toString()}`)
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {/* Multiple gradient layers for a rich background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-blue-900/30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        </div>

        {/* Back button */}
        <div className="absolute top-4 left-4 z-20">
          <Link href="/get-started">
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center z-10 px-4 py-16">
          <motion.div 
            className="max-w-4xl w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Plan Your Study Time</CardTitle>
                <CardDescription>
                  Set your time commitment and optionally upload study materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Topic section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label htmlFor="topic" className="text-xl font-bold text-purple-800">What do you want to study?</Label>
                    </div>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Machine-learning evaluation metrics, intermediate level"
                      className="text-lg py-6 border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-lg shadow-sm"
                    />
                  </div>

                  {/* Time commitment section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label className="text-xl font-bold text-purple-800">Time Commitment</Label>
                    </div>

                    <div className="space-y-6">
                      {/* Frequency selection */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Sessions per week</Label>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                            <button
                              key={`freq-${value}`}
                              type="button"
                              onClick={() => setFrequency(value.toString())}
                              className={`w-12 h-12 rounded-lg font-medium transition-all duration-200 transform ${
                                frequency === value.toString()
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg scale-105 border-2 border-purple-300'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md hover:scale-105 border border-purple-200'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration selection */}
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Minutes per session</Label>
                        <div className="flex flex-wrap gap-2">
                          {[5, 10, 15, 20, 25, 30, 45, 60].map((value) => (
                            <button
                              key={`dur-${value}`}
                              type="button"
                              onClick={() => setDuration(value.toString())}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform ${
                                duration === value.toString()
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg scale-105 border-2 border-purple-300'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md hover:scale-105 border border-purple-200'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border-2 border-purple-200 shadow-md">
                      <p className="text-center">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                          {frequency} × {duration} min/week
                        </span>
                      </p>
                      <p className="text-center text-purple-700 text-sm mt-1">
                        Total: {parseInt(frequency) * parseInt(duration)} minutes per week
                      </p>
                    </div>
                  </div>

                  {/* Mastery Depth section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label className="text-xl font-bold text-purple-800">Mastery Depth</Label>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-gray-600">How in-depth do you want to master this topic?</Label>
                          <span className="text-lg font-bold text-purple-700">{masteryDepth}/100</span>
                        </div>
                        <Slider
                          value={[masteryDepth]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(value) => setMasteryDepth(value[0])}
                          className="py-4"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Basic understanding</span>
                          <span>Complete mastery</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Study Duration Span section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label className="text-xl font-bold text-purple-800">Study Duration</Label>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-gray-600">How long do you want your study plan to span?</Label>
                          <span className="text-lg font-bold text-purple-700">
                            {studySpan === 1 ? '1 day' : 
                             studySpan === 7 ? '1 week' : 
                             studySpan === 14 ? '2 weeks' : 
                             studySpan === 30 ? '1 month' : 
                             studySpan === 90 ? '3 months' : 
                             studySpan === 180 ? '6 months' : 
                             studySpan === 365 ? '1 year' : 
                             `${studySpan} days`}
                          </span>
                        </div>
                        <Slider
                          value={[studySpan]}
                          min={1}
                          max={365}
                          step={1}
                          onValueChange={(value) => setStudySpan(value[0])}
                          className="py-4"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>1 day</span>
                          <span>1 year</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: 1, label: '1 day' },
                            { value: 7, label: '1 week' },
                            { value: 14, label: '2 weeks' },
                            { value: 30, label: '1 month' },
                            { value: 90, label: '3 months' },
                            { value: 180, label: '6 months' },
                            { value: 365, label: '1 year' }
                          ].map((option) => (
                            <button
                              key={`span-${option.value}`}
                              type="button"
                              onClick={() => setStudySpan(option.value)}
                              className="px-3 py-1 text-xs rounded-lg font-medium transition-all duration-200 transform bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md hover:scale-105 border border-purple-200"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Age Group section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label className="text-xl font-bold text-purple-800">Age Group</Label>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm text-gray-600">Select the age group for this course</Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: '10-12', label: '10-12' },
                            { value: '13-16', label: '13-16' },
                            { value: '17-20', label: '17-20' },
                            { value: '21+', label: '21+' }
                          ].map((option) => (
                            <button
                              key={`age-${option.value}`}
                              type="button"
                              onClick={() => setAgeGroup(option.value)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform ${
                                ageGroup === option.value
                                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg scale-105 border-2 border-purple-300'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md hover:scale-105 border border-purple-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File upload section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                      <Label className="text-xl font-bold text-purple-800">Optional: Upload Study Materials</Label>
                    </div>
                    <FileUpload 
                      onTextExtracted={handleTextExtracted} 
                      isProcessing={isProcessing}
                    />
                    {textSource && (
                      <p className="text-sm text-green-600">
                        Successfully extracted text from: {textSource}
                      </p>
                    )}
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] border-2 border-purple-300"
                  >
                    Create My Study Plan
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

// Main component that wraps PlanStudyContent with Suspense
export default function PlanStudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col relative">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900"></div>
        </div>
        <div className="flex-1 flex items-center justify-center z-10 px-4 py-16">
          <div className="bg-white/95 backdrop-blur-sm shadow-xl p-8 rounded-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-semibold mb-2">Loading Study Planner</h1>
            <p className="text-gray-600">Preparing your study planning tools...</p>
          </div>
        </div>
      </div>
    }>
      <PlanStudyContent />
    </Suspense>
  );
}
