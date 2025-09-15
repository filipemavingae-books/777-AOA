"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  CreditCard,
  GamepadIcon,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
} from "lucide-react"

interface Withdrawal {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  username: string
  email: string
  kyc_level: number
  meta: any
}

interface Game {
  id: string
  entry_fee: number
  currency: string
  status: string
  created_at: string
  finished_at?: string
  host_username: string
  player_count: number
  total_pot: number
}

interface Stats {
  users: {
    total_users: number
    new_users_24h: number
    verified_users: number
    kyc_users: number
  }
  games: {
    total_games: number
    games_24h: number
    finished_games: number
    avg_entry_fee: number
  }
  transactions: {
    total_transactions: number
    total_deposits: number
    total_withdrawals: number
    pending_withdrawals: number
  }
  wallets: {
    total_balance: number
    total_locked: number
    total_wallets: number
  }
}

export default function AdminTabs() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [withdrawalsRes, gamesRes, statsRes] = await Promise.all([
        fetch("/api/admin/withdrawals"),
        fetch("/api/admin/games"),
        fetch("/api/admin/stats"),
      ])

      const [withdrawalsData, gamesData, statsData] = await Promise.all([
        withdrawalsRes.json(),
        gamesRes.json(),
        statsRes.json(),
      ])

      if (withdrawalsData.success) setWithdrawals(withdrawalsData.withdrawals)
      if (gamesData.success) setGames(gamesData.games)
      if (statsData.success) setStats(statsData.stats)
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: string, reason: string) => {
    setActionLoading(withdrawalId)
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, reason }),
      })

      const data = await response.json()
      if (data.success) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      case "pending_withdrawal":
        return <Badge variant="secondary">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">
          <BarChart3 className="w-4 h-4 mr-2" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="withdrawals">
          <CreditCard className="w-4 h-4 mr-2" />
          Saques
        </TabsTrigger>
        <TabsTrigger value="games">
          <GamepadIcon className="w-4 h-4 mr-2" />
          Jogos
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users className="w-4 h-4 mr-2" />
          Usuários
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats.users.total_users}</p>
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+{stats.users.new_users_24h} hoje</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats.games.total_games}</p>
                      <p className="text-sm text-muted-foreground">Total de Jogos</p>
                    </div>
                    <GamepadIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+{stats.games.games_24h} hoje</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats.wallets.total_balance.toFixed(2)} AOA</p>
                      <p className="text-sm text-muted-foreground">Saldo Total</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-muted-foreground">{stats.wallets.total_locked.toFixed(2)} AOA bloqueado</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats.transactions.pending_withdrawals}</p>
                      <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-muted-foreground">Requer atenção</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total de Depósitos</span>
                      <span className="font-bold text-green-600">
                        {stats.transactions.total_deposits.toFixed(2)} AOA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total de Saques</span>
                      <span className="font-bold text-red-600">
                        {stats.transactions.total_withdrawals.toFixed(2)} AOA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total de Transações</span>
                      <span className="font-bold">{stats.transactions.total_transactions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Usuários Verificados</span>
                      <span className="font-bold text-green-600">{stats.users.verified_users}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Usuários com KYC</span>
                      <span className="font-bold text-blue-600">{stats.users.kyc_users}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taxa de Verificação</span>
                      <span className="font-bold">
                        {((stats.users.verified_users / stats.users.total_users) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="withdrawals" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{withdrawal.username}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {withdrawal.amount} {withdrawal.currency}
                      </p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p>{new Date(withdrawal.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">KYC Level</p>
                      <p>Nível {withdrawal.kyc_level}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="capitalize">{withdrawal.status}</p>
                    </div>
                  </div>

                  {withdrawal.status === "pending_withdrawal" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleWithdrawalAction(withdrawal.id, "approve", "Aprovado pelo admin")}
                        disabled={actionLoading === withdrawal.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {actionLoading === withdrawal.id ? "Processando..." : "Aprovar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleWithdrawalAction(withdrawal.id, "reject", "Rejeitado pelo admin")}
                        disabled={actionLoading === withdrawal.id}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="games" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {games.map((game) => (
                <div key={game.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Jogo #{game.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">Host: {game.host_username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {game.total_pot} {game.currency}
                      </p>
                      <Badge variant={game.status === "finished" ? "default" : "secondary"}>{game.status}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Entrada</p>
                      <p>
                        {game.entry_fee} {game.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jogadores</p>
                      <p>{game.player_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Criado</p>
                      <p>{new Date(game.created_at).toLocaleDateString("pt-PT")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="capitalize">{game.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>A gestão detalhada de usuários está disponível na aba de Anti-Fraude.</AlertDescription>
        </Alert>
      </TabsContent>
    </Tabs>
  )
}
