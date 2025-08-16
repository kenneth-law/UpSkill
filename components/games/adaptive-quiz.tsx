'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Brain, Target, TrendingUp, TrendingDown } from 'lucide-react'

interface AdaptiveQuizProps {
  questions: Array<{
    id: string
    text: string
    type: 'mcq' | 'true_false'
    options?: string[]
    correctAnswer: string
    difficulty: number
    explanation?: string
  }>
  initialMastery: number
  onComplete: (finalMastery: number, responses: any[]) => void
}

export function AdaptiveQuiz({ questions, initialMastery = 0.3, onComplete }: AdaptiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [mastery, setMastery] = useState(initialMastery)
  const [responses, setResponses] = useState<any[]>([])
  const [answeredIds, setAnsweredIds] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [questionCount, setQuestionCount] = useState(0)
  const [startTime, setStartTime] = useState(Date.now())

  // Fixed answer matching function with better debugging
  const answersMatch = (userAnswer: string, correctAnswer: string) => {
    const normalizedUser = String(userAnswer || '').trim().toLowerCase()
    const normalizedCorrect = String(correctAnswer || '').trim().toLowerCase()

    console.log('Comparing answers:', {
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      normalizedUser: normalizedUser,
      normalizedCorrect: normalizedCorrect,
      matches: normalizedUser === normalizedCorrect
    })

    return normalizedUser === normalizedCorrect
  }

  // Mock questions if none provided
  const mockQuestions = questions.length > 0 ? questions : [
    {
      id: '1',
      text: 'Which of the following is a characteristic of photosynthesis?',
      type: 'mcq',
      options: [
        'Consumes oxygen',
        'Produces glucose',
        'Occurs only at night',
        'Requires animal cells'
      ],
      correctAnswer: 'Produces glucose',
      difficulty: 0.3,
      explanation: 'Photosynthesis is the process by which plants convert light energy into chemical energy, producing glucose and oxygen.'
    },
    {
      id: '2',
      text: 'Mitochondria are responsible for cellular respiration.',
      type: 'true_false',
      correctAnswer: 'true',
      difficulty: 0.2,
      explanation: 'Mitochondria are the powerhouse of the cell, responsible for producing ATP through cellular respiration.'
    },
    {
      id: '3',
      text: 'Which of the following is NOT a phase of mitosis?',
      type: 'mcq',
      options: [
        'Prophase',
        'Metaphase',
        'Synthesis',
        'Telophase'
      ],
      correctAnswer: 'Synthesis',
      difficulty: 0.7,
      explanation: 'Synthesis is part of interphase (S phase), not mitosis. The phases of mitosis are prophase, metaphase, anaphase, and telophase.'
    },
    {
      id: '4',
      text: 'The law of conservation of energy states that energy cannot be created or destroyed.',
      type: 'true_false',
      correctAnswer: 'true',
      difficulty: 0.4,
      explanation: 'The law of conservation of energy states that energy cannot be created or destroyed, only transformed from one form to another.'
    },
    {
      id: '5',
      text: 'Which of the following is a primary function of the liver?',
      type: 'mcq',
      options: [
        'Filtering blood',
        'Producing insulin',
        'Storing memories',
        'Generating red blood cells'
      ],
      correctAnswer: 'Filtering blood',
      difficulty: 0.5,
      explanation: 'The liver filters blood coming from the digestive tract, detoxifying chemicals and metabolizing drugs.'
    }
  ]

  // Initialize with first question
  useEffect(() => {
    if (mockQuestions.length > 0) {
      setCurrentQuestion(mockQuestions[0])
    }
  }, [])

  // Placeholder for mastery calculation - will be implemented with proper algorithm later
  const calculateMasteryUpdate = (
    currentMastery: number,
    isCorrect: boolean,
    responseTime: number,
    questionDifficulty: number
  ) => {
    console.log("Updating mastery:", { currentMastery, isCorrect, responseTime, questionDifficulty })
    // Simple placeholder algorithm
    const difficultyFactor = questionDifficulty * 0.5
    const timeFactor = Math.min(1, 30 / responseTime) * 0.2

    if (isCorrect) {
      console.log("Answer correct - increasing mastery")
      return Math.min(1, currentMastery + difficultyFactor * (0.1 + timeFactor))
    } else {
      console.log("Answer incorrect - decreasing mastery")
      return Math.max(0, currentMastery - difficultyFactor * 0.15)
    }
  }

  // Placeholder for question selection - will be implemented with proper algorithm later
  const selectNextQuestion = (
    allQuestions: typeof mockQuestions,
    currentMastery: number,
    answeredQuestionIds: string[]
  ) => {
    // Filter out already answered questions
    const availableQuestions = allQuestions.filter(q => !answeredQuestionIds.includes(q.id))

    if (availableQuestions.length === 0) {
      return allQuestions[0] // Fallback to first question if all answered
    }

    // Find questions closest to current mastery level
    availableQuestions.sort((a, b) =>
      Math.abs(a.difficulty - currentMastery) - Math.abs(b.difficulty - currentMastery)
    )

    return availableQuestions[0]
  }

  const handleSubmit = () => {
    const responseTime = (Date.now() - startTime) / 1000
    const isCorrect = answersMatch(selectedAnswer, currentQuestion.correctAnswer)

    console.log('Submit details:', {
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      responseTime
    })

    // Update mastery
    const newMastery = calculateMasteryUpdate(
      mastery,
      isCorrect,
      responseTime,
      currentQuestion.difficulty
    )

    setMastery(newMastery)
    setStreak(isCorrect ? streak + 1 : 0)

    // Record response
    const response = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSeconds: responseTime,
      masteryAfter: newMastery
    }

    setResponses(prev => [...prev, response])
    setAnsweredIds(prev => [...prev, currentQuestion.id])
    setShowFeedback(true)
  }

  const nextQuestion = () => {
    setQuestionCount(prev => prev + 1)

    // End quiz after 10 questions or if mastery is very high/low
    if (questionCount >= 9 || mastery > 0.95 || mastery < 0.05) {
      onComplete(mastery, responses)
      return
    }

    // Select next question adaptively
    const next = selectNextQuestion(
      mockQuestions,
      mastery,
      answeredIds
    )

    setCurrentQuestion(next)
    setSelectedAnswer('')
    setShowFeedback(false)
    setStartTime(Date.now())
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.3) return 'text-green-600'
    if (difficulty < 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMasteryLabel = (level: number) => {
    if (level < 0.2) return 'Novice'
    if (level < 0.4) return 'Beginner'
    if (level < 0.6) return 'Intermediate'
    if (level < 0.8) return 'Advanced'
    return 'Expert'
  }

  // If no current question, show loading state
  if (!currentQuestion) {
    return <div className="flex items-center justify-center h-full">Loading questions...</div>
  }

  return (
    <div className="w-full h-full aspect-20-9 mx-auto p-4 flex flex-col">
      {/* Two-column layout optimized for 20:9 ratio */}
      <div className="flex flex-row h-full gap-6">
        {/* Left column - Stats and Progress */}
        <div className="w-1/3 flex flex-col">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Brain className="w-7 h-7 text-blue-600" />
                <div className="flex-grow">
                  <p className="text-base text-gray-600">Mastery</p>
                  <p className="font-semibold text-lg">{getMasteryLabel(mastery)}</p>
                  <Progress value={mastery * 100} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="w-7 h-7 text-green-600" />
                <div className="flex-grow">
                  <p className="text-base text-gray-600">Streak</p>
                  <p className="font-semibold text-lg">{streak}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-7 h-7 ${getDifficultyColor(currentQuestion.difficulty)}`}>
                  {currentQuestion.difficulty > mastery ? (
                    <TrendingUp />
                  ) : (
                    <TrendingDown />
                  )}
                </div>
                <div className="flex-grow">
                  <p className="text-base text-gray-600">Difficulty</p>
                  <p className="font-semibold text-lg">
                    {Math.round(currentQuestion.difficulty * 100)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>Question {questionCount + 1} of 10</span>
              <span>Adapting...</span>
            </div>
            <Progress value={(questionCount + 1) * 10} className="h-3" />
          </div>
        </div>

        {/* Right column - Question and Options */}
        <div className="w-2/3 flex flex-col">
          {/* Question Card */}
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {currentQuestion.type === 'mcq' && currentQuestion.options ? (
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={setSelectedAnswer}
                  disabled={showFeedback}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <RadioGroupItem value={option} id={`option-${index}`} className="w-5 h-5" />
                      <Label
                        htmlFor={`option-${index}`}
                        className={`cursor-pointer text-lg ${
                          showFeedback && answersMatch(option, currentQuestion.correctAnswer)
                            ? 'text-green-600 font-semibold'
                            : showFeedback && option === selectedAnswer && !answersMatch(option, currentQuestion.correctAnswer)
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={setSelectedAnswer}
                  disabled={showFeedback}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <RadioGroupItem value="true" id="true" className="w-5 h-5" />
                    <Label
                      htmlFor="true"
                      className={`cursor-pointer text-lg ${
                        showFeedback && answersMatch('true', currentQuestion.correctAnswer)
                          ? 'text-green-600 font-semibold'
                          : showFeedback && selectedAnswer === 'true' && !answersMatch('true', currentQuestion.correctAnswer)
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <RadioGroupItem value="false" id="false" className="w-5 h-5" />
                    <Label
                      htmlFor="false"
                      className={`cursor-pointer text-lg ${
                        showFeedback && answersMatch('false', currentQuestion.correctAnswer)
                          ? 'text-green-600 font-semibold'
                          : showFeedback && selectedAnswer === 'false' && !answersMatch('false', currentQuestion.correctAnswer)
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {showFeedback && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold mb-3 text-lg">
                    {answersMatch(selectedAnswer, currentQuestion.correctAnswer) ? (
                      <span className="text-green-600">✓ Correct!</span>
                    ) : (
                      <span className="text-red-600">✗ Incorrect</span>
                    )}
                  </p>
                  {!answersMatch(selectedAnswer, currentQuestion.correctAnswer) && (
                    <p className="text-base text-gray-700 mb-2">
                      <strong>Correct answer:</strong> {currentQuestion.correctAnswer}
                    </p>
                  )}
                  {currentQuestion.explanation && (
                    <p className="text-base text-gray-700">{currentQuestion.explanation}</p>
                  )}
                  <div className="mt-3 text-base text-gray-600">
                    Mastery: {Math.round(mastery * 100)}%
                    ({mastery > initialMastery ? '+' : ''}{Math.round((mastery - initialMastery) * 100)}%)
                  </div>
                </div>
              )}

              <div className="mt-6">
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    className="w-full py-6 text-lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={nextQuestion} className="w-full py-6 text-lg">
                    {questionCount >= 9 ? 'Finish Quiz' : 'Next Question'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}