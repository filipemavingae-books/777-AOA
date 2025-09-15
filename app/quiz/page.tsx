"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Clock, Zap, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import GameLobby from "@/components/game-lobby"
import QuizGame from "@/components/quiz-game"

interface Game {
  id: string
  entry_fee: number
  max_players: number
  current_players: number
  host_username: string
  created_at: string
}

export default function QuizPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gameState, setGameState] = useState<"lobby" | "playing" | "finished">("lobby")
  const router = useRouter()
  const backgroundMusicRef = useRef<HTMLAudioElement>(null)
  const correctSoundRef = useRef<HTMLAudioElement>(null)
  const wrongSoundRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetchGames()
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = 0.3
      backgroundMusicRef.current.loop = true
      backgroundMusicRef.current.play().catch(console.error)
    }

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
      }
    }
  }, [])

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/quiz/games")
      const data = await response.json()

      if (data.success) {
        setGames(data.games)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGame = async () => {
    try {
      const response = await fetch("/api/quiz/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryFee: 50 }),
      })

      const data = await response.json()

      if (data.success) {
        setSelectedGame(data.game.id)
        setGameState("lobby")
      }
    } catch (error) {
      console.error("Error creating game:", error)
    }
  }

  const handleJoinGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/quiz/games/${gameId}/join`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setSelectedGame(gameId)
        setGameState("lobby")
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error joining game:", error)
    }
  }

  const handleBackToLobby = () => {
    setSelectedGame(null)
    setGameState("lobby")
    fetchGames()
  }

  const playCorrectSound = () => {
    if (correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0
      correctSoundRef.current.play().catch(console.error)
    }
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }

  const playWrongSound = () => {
    if (wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0
      wrongSoundRef.current.play().catch(console.error)
    }
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }

  if (selectedGame && gameState === "playing") {
    return <QuizGame gameId={selectedGame} onFinish={() => setGameState("finished")} onBack={handleBackToLobby} />
  }

  if (selectedGame && gameState === "lobby") {
    return <GameLobby gameId={selectedGame} onStartGame={() => setGameState("playing")} onBack={handleBackToLobby} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black">
      <audio ref={backgroundMusicRef} preload="auto">
        <source src="/sounds/quiz-background.mp3" type="audio/mpeg" />
        <source src="/sounds/quiz-background.ogg" type="audio/ogg" />
      </audio>

      <audio ref={correctSoundRef} preload="auto">
        <source src="/sounds/correct.mp3" type="audio/mpeg" />
        <source src="/sounds/correct.ogg" type="audio/ogg" />
      </audio>

      <audio ref={wrongSoundRef} preload="auto">
        <source src="/sounds/wrong.mp3" type="audio/mpeg" />
        <source src="/sounds/wrong.ogg" type="audio/ogg" />
      </audio>

      <header className="border-b border-purple-500/20 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="hover:bg-purple-500/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-white">Voltar</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  Quiz Competitivo
                </h1>
                <p className="text-sm text-purple-300">Teste seus conhecimentos e ganhe prémios</p>
              </div>
            </div>

            <Button
              onClick={handleCreateGame}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 animate-pulse"
            >
              <Zap className="w-4 h-4 mr-2" />
              Criar Jogo
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">4,289+</p>
                  <p className="text-sm text-purple-300">Perguntas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{games.length}</p>
                  <p className="text-sm text-blue-300">Jogos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-green-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">30s</p>
                  <p className="text-sm text-green-300">Por Pergunta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">50</p>
                  <p className="text-sm text-yellow-300">AOA Entrada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Trophy className="w-5 h-5 mr-2 text-purple-400" />
              Jogos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-300 mb-4">Nenhum jogo disponível no momento</p>
                <Button
                  onClick={handleCreateGame}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Criar Primeiro Jogo
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className="bg-black/60 border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-105"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-white">Jogo #{game.id.slice(-6)}</p>
                          <p className="text-sm text-purple-300">Host: @{game.host_username}</p>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {game.entry_fee} AOA
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-white">
                            {game.current_players}/{game.max_players}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-white">
                            {new Date(game.created_at).toLocaleTimeString("pt-PT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700"
                        onClick={() => handleJoinGame(game.id)}
                        disabled={game.current_players >= game.max_players}
                      >
                        {game.current_players >= game.max_players ? "Jogo Lotado" : "Entrar no Jogo"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
