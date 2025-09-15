"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Zap, CheckCircle, XCircle } from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  difficulty: number
  category: string
}

interface QuizGameProps {
  gameId: string
  onFinish: () => void
  onBack: () => void
}

export default function QuizGame({ gameId, onFinish, onBack }: QuizGameProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResult, setShowResult] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !gameFinished && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(null) // Auto-submit when time runs out
    }
  }, [timeLeft, gameFinished, showResult])

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/quiz/questions?count=10")
      const data = await response.json()

      if (data.success) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = useCallback(
    async (answer: number | null) => {
      if (showResult) return

      const timeSpent = 30 - timeLeft
      setShowResult(true)

      try {
        // In a real implementation, you would submit the answer to the server
        // For now, we'll simulate the scoring locally
        const question = questions[currentQuestion]
        const isCorrect = answer === 0 // Assuming first option is always correct for demo
        setLastAnswerCorrect(isCorrect)

        if (isCorrect) {
          const baseScore = question.difficulty * 100
          const timeBonus = Math.max(0, 30 - timeSpent) * 10
          const questionScore = baseScore + timeBonus
          setScore((prev) => prev + questionScore)
        }

        // Show result for 2 seconds, then move to next question
        setTimeout(() => {
          if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1)
            setSelectedAnswer(null)
            setTimeLeft(30)
            setShowResult(false)
            setLastAnswerCorrect(null)
          } else {
            setGameFinished(true)
            onFinish()
          }
        }, 2000)
      } catch (error) {
        console.error("Error submitting answer:", error)
      }
    },
    [currentQuestion, questions, timeLeft, showResult, onFinish],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perguntas...</p>
        </div>
      </div>
    )
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Jogo Finalizado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div>
              <p className="text-3xl font-bold text-primary">{score}</p>
              <p className="text-muted-foreground">Pontuação Final</p>
            </div>
            <div>
              <p className="text-lg">
                {currentQuestion + 1}/{questions.length} perguntas respondidas
              </p>
            </div>
            <Button onClick={onBack} className="w-full">
              Voltar ao Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 blur-backdrop">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{timeLeft}s</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{score} pontos</span>
              </div>
            </div>
            <Badge variant="secondary">
              {currentQuestion + 1}/{questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {showResult ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  {lastAnswerCorrect ? (
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-500" />
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">{lastAnswerCorrect ? "Correto!" : "Incorreto!"}</h2>
                <p className="text-muted-foreground">
                  {lastAnswerCorrect
                    ? `+${question.difficulty * 100 + Math.max(0, 30 - (30 - timeLeft)) * 10} pontos`
                    : "Nenhum ponto ganho"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {question.category}
                    </Badge>
                    <CardTitle className="text-xl text-balance">{question.question}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: question.difficulty }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-primary rounded-full"></div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {question.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className="h-auto p-4 text-left justify-start bg-transparent"
                      onClick={() => {
                        setSelectedAnswer(index)
                        handleAnswer(index)
                      }}
                      disabled={showResult}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
