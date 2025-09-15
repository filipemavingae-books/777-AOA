"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Trophy, ArrowLeft } from "lucide-react"

interface GameLobbyProps {
  gameId: string
  onStartGame: () => void
  onBack: () => void
}

interface GameDetails {
  id: string
  entry_fee: number
  max_players: number
  current_players: number
  prize_pool: number
  status: string
  players: Array<{
    username: string
    score: number
  }>
}

export default function GameLobby({ gameId, onStartGame, onBack }: GameLobbyProps) {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    fetchGameDetails()
    const interval = setInterval(fetchGameDetails, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [gameId])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      onStartGame()
    }
  }, [countdown, onStartGame])

  const fetchGameDetails = async () => {
    try {
      // In a real implementation, you would fetch game details from the API
      // For now, we'll simulate the data
      setGameDetails({
        id: gameId,
        entry_fee: 50,
        max_players: 10,
        current_players: 1,
        prize_pool: 50,
        status: "pending",
        players: [{ username: "Você", score: 0 }],
      })
    } catch (error) {
      console.error("Error fetching game details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = () => {
    setCountdown(5) // 5 second countdown
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!gameDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Jogo não encontrado</p>
            <Button onClick={onBack} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 blur-backdrop">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold">Lobby do Jogo</h1>
                <p className="text-sm text-muted-foreground">Aguardando jogadores...</p>
              </div>
            </div>
            <Badge variant="secondary">#{gameDetails.id.slice(-6)}</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {countdown !== null ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-primary">{countdown}</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Jogo Iniciando...</h2>
                <p className="text-muted-foreground">Prepare-se para o quiz!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Game Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Informações do Jogo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{gameDetails.entry_fee}</p>
                        <p className="text-sm text-muted-foreground">AOA Entrada</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{gameDetails.prize_pool}</p>
                        <p className="text-sm text-muted-foreground">Prémio Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">10</p>
                        <p className="text-sm text-muted-foreground">Perguntas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">30s</p>
                        <p className="text-sm text-muted-foreground">Por Pergunta</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Distribuição de Prémios:</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>🥇 1º Lugar:</span>
                          <span className="font-medium">70% ({(gameDetails.prize_pool * 0.7).toFixed(0)} AOA)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🥈 2º Lugar:</span>
                          <span className="font-medium">20% ({(gameDetails.prize_pool * 0.2).toFixed(0)} AOA)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🥉 3º Lugar:</span>
                          <span className="font-medium">10% ({(gameDetails.prize_pool * 0.1).toFixed(0)} AOA)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Como Jogar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </div>
                        <p>Responda 10 perguntas de múltipla escolha</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </div>
                        <p>Cada pergunta tem 30 segundos para ser respondida</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </div>
                        <p>Pontuação baseada na dificuldade e velocidade de resposta</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          4
                        </div>
                        <p>Os 3 primeiros colocados ganham prémios em AOA</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Players List */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Jogadores
                      </div>
                      <Badge variant="secondary">
                        {gameDetails.current_players}/{gameDetails.max_players}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gameDetails.players.map((player, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{player.username[0].toUpperCase()}</span>
                            </div>
                            <span className="font-medium">{player.username}</span>
                          </div>
                          <Badge variant="outline">Pronto</Badge>
                        </div>
                      ))}

                      {/* Empty slots */}
                      {Array.from({ length: gameDetails.max_players - gameDetails.current_players }).map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border-2 border-dashed rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <span className="text-muted-foreground">Aguardando jogador...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleStartGame} className="w-full" size="lg">
                  Iniciar Jogo
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
