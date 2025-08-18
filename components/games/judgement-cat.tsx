'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, SkipForward } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface JudgementCatProps {
  questions: Array<{
    id: string
    text: string
    correctAnswer: string
    type: 'short_answer'
  }>
  onComplete: (score: number, responses: any[]) => void
}

export function JudgementCat({ questions, onComplete }: JudgementCatProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean
    catResponse: string
    explanation: string
  } | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [score, setScore] = useState(0)
  const [catMood, setCatMood] = useState(':3')
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock questions if none provided
  const questionsToUse = questions.length > 0 ? questions : [
    {
      id: '1',
      text: 'Explain the concept of photosynthesis in your own words.',
      correctAnswer: 'Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.',
      type: 'short_answer' as const
    },
    {
      id: '2',
      text: 'What is the significance of the mitochondria in a cell?',
      correctAnswer: 'Mitochondria are the powerhouse of the cell, responsible for producing ATP through cellular respiration, providing energy for cellular functions.',
      type: 'short_answer' as const
    },
    {
      id: '3',
      text: 'Describe the water cycle in nature.',
      correctAnswer: 'The water cycle is the continuous movement of water on, above, and below Earth\'s surface through processes of evaporation, condensation, precipitation, and collection.',
      type: 'short_answer' as const
    }
  ]

  const currentQuestion = questionsToUse[currentIndex]

  // Placeholder for the evaluation function - will be implemented with API call later
  const evaluateAnswer = async () => {
    setIsProcessing(true)

    try {
    const res = await fetch('/api/judgement-cat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: currentQuestion.text,
        userAnswer,
      }),
    });


    const data = await res.json();

    setFeedback({
      isCorrect: data.isCorrect,
      catResponse: data.catResponse,
      explanation: data.explanation,
    });

    setCatMood(data.isCorrect ? '=^.^=' : '-.-');

    // Track response
    const responseData = {
      questionId: currentQuestion.id,
      userAnswer,
      isCorrect: data.isCorrect,
      score: data.isCorrect ? 1 : 0,
    };

    setResponses(prev => [...prev, responseData]);
    if (data.isCorrect) setScore(prev => prev + 1);
  } catch (err) {
    setFeedback({
      isCorrect: false,
      catResponse: "Something went wrong. Even I can't judge this.",
      explanation: "API error. Please try again.",
    });
    setCatMood('>.>');
  }

  setIsProcessing(false);

  //   // Simulate API call delay
  //   await new Promise(resolve => setTimeout(resolve, 1500))

  //   // Mock evaluation logic
  //   const isCorrect = Math.random() > 0.5 // Random result for placeholder

  //   // Mock cat responses
  //   const correctResponses = [
  //     "Hmm, not terrible. For a human.",
  //     "Correct. Don't let it go to your head, meatbag.",
  //     "Well well, looks like you're not completely hopeless."
  //   ]

  //   const incorrectResponses = [
  //     "Wrong. But I expected nothing less from you.",
  //     "That's incorrect. Even my tail could've answered that.",
  //     "*yawns* Wake me when you get one right."
  //   ]

  //   setFeedback({
  //     isCorrect,
  //     catResponse: isCorrect
  //       ? correctResponses[Math.floor(Math.random() * correctResponses.length)]
  //       : incorrectResponses[Math.floor(Math.random() * incorrectResponses.length)],
  //     explanation: isCorrect
  //       ? "Your answer covers the key points correctly."
  //       : "Your answer is missing some key concepts or contains inaccuracies."
  //   })

  //   setCatMood(isCorrect ? '=^.^=' : '-.-')

  //   // Track response
  //   const responseData = {
  //     questionId: currentQuestion.id,
  //     userAnswer,
  //     isCorrect,
  //     score: isCorrect ? 1 : 0
  //   }

  //   setResponses(prev => [...prev, responseData])
  //   if (isCorrect) setScore(prev => prev + 1)

  //   setIsProcessing(false)
  // }
  }

  const nextQuestion = () => {
    if (currentIndex < questionsToUse.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUserAnswer('')
      setFeedback(null)
      setCatMood(':3')
    } else {
      // Game complete
      const finalScore = Math.round((score / questionsToUse.length) * 100)
      onComplete(finalScore, responses)
    }
  }

  const skipQuestion = () => {
    setFeedback({
      isCorrect: false,
      catResponse: "Giving up already? How predictable.",
      explanation: "You skipped this question."
    })
    setCatMood('Ò.ó')

    setResponses(prev => [...prev, {
      questionId: currentQuestion.id,
      userAnswer: '',
      isCorrect: false,
      score: 0,
      skipped: true
    }])

    setTimeout(nextQuestion, 2000)
  }

  return (
    <div className="w-full h-full aspect-20-9 mx-auto p-4 flex flex-col">
      {/* Two-column layout optimized for 20:9 ratio */}
      <div className="flex flex-row h-full gap-6">
        {/* Left column - Cat and Progress */}
        <div className="w-1/3 flex flex-col">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>Question {currentIndex + 1} of {questionsToUse.length}</span>
              <span>Score: {score}/{currentIndex}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questionsToUse.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Cat Avatar - Larger for touch */}
          <motion.div
            className="text-center flex-grow flex flex-col justify-center items-center"
            animate={{
              rotate: feedback?.isCorrect ? [0, 10, -10, 0] : 0,
              scale: feedback ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-8xl mb-4">{catMood}</div>
            <p className="text-lg text-gray-600">Judgement Cat is watching...</p>
          </motion.div>
        </div>

        {/* Right column - Question and Input */}
        <div className="w-2/3 flex flex-col">
          {/* Question Card */}
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentQuestion.text}
                </ReactMarkdown>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <Textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here, meatbag..."
                className="mb-6 flex-grow text-lg"
                rows={6}
                disabled={!!feedback || isProcessing}
              />

              {!feedback && (
                <div className="flex gap-4">
                  <Button
                    onClick={evaluateAnswer}
                    disabled={!userAnswer.trim() || isProcessing}
                    className="flex-1 py-6 text-lg"
                  >
                    <Send className="w-6 h-6 mr-3" />
                    {isProcessing ? 'Judging...' : 'Submit for Judgement'}
                  </Button>
                  <Button
                    onClick={skipQuestion}
                    variant="outline"
                    disabled={isProcessing}
                    className="py-6 px-6 text-lg"
                  >
                    <SkipForward className="w-6 h-6 mr-3" />
                    Skip
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <Card className={feedback.isCorrect ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="pt-6">
              <div className="mb-4">
                <p className="font-semibold mb-2">
                  {feedback.isCorrect ? '✓ Correct!' : '✗ Wrong!'}
                </p>
                <p className="italic text-gray-700">"{feedback.catResponse}"</p>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-semibold mb-1">Explanation:</p>
                <p className="text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {feedback.explanation}
                  </ReactMarkdown>
                </p>
                <p className="text-sm mt-2">
                  <span className="font-semibold">Correct answer: </span>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {currentQuestion.correctAnswer}
                  </ReactMarkdown>
                </p>
              </div>

              <Button onClick={nextQuestion} className="w-full">
                {currentIndex < questionsToUse.length - 1 ? 'Next Question' : 'Finish'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
