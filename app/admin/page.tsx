"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, AlertTriangle, Ban, Eye, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import AdminTabs from "@/components/admin-tabs"

interface SuspiciousUser {
  id: string
  username: string
  email: string
  created_at: string
  is_active: boolean
  device_user_count: number
  device_flagged: boolean
  recent_activity: number
}

export default function AdminPage() {
  const [suspiciousUsers, setSuspiciousUsers] = useState<SuspiciousUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchSuspiciousUsers()
  }, [])

  const fetchSuspiciousUsers = async () => {
    try {
      const response = await fetch("/api/admin/suspicious-users")
      const data = await response.json()

      if (data.success) {
        setSuspiciousUsers(data.users)
      } else if (data.error === "Acesso negado") {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching suspicious users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFlagUser = async (userId: string, reason: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch("/api/admin/flag-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      })

      const data = await response.json()

      if (data.success) {
        fetchSuspiciousUsers() // Refresh the list
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error flagging user:", error)
      alert("Erro ao sinalizar usuário")
    } finally {
      setActionLoading(null)
    }
  }

  const getRiskLevel = (user: SuspiciousUser) => {
    if (!user.is_active || user.device_flagged) return "high"
    if (user.device_user_count > 3 || user.recent_activity > 50) return "medium"
    return "low"
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "high":
        return <Badge variant="destructive">Alto Risco</Badge>
      case "medium":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Médio Risco
          </Badge>
        )
      default:
        return <Badge variant="outline">Baixo Risco</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestão da Plataforma</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Tabs */}
        <AdminTabs />

        {/* Anti-Fraud Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Sistema Anti-Fraude</h2>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{suspiciousUsers.length}</p>
                    <p className="text-sm text-muted-foreground">Usuários Suspeitos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {suspiciousUsers.filter((u) => getRiskLevel(u) === "high").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Alto Risco</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Ban className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{suspiciousUsers.filter((u) => !u.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Contas Bloqueadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{suspiciousUsers.filter((u) => u.device_flagged).length}</p>
                    <p className="text-sm text-muted-foreground">Dispositivos Sinalizados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suspicious Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Usuários Suspeitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suspiciousUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma atividade suspeita detectada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousUsers.map((user) => {
                    const riskLevel = getRiskLevel(user)
                    return (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{user.username[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRiskBadge(riskLevel)}
                            {!user.is_active && <Badge variant="destructive">Bloqueado</Badge>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Criado em</p>
                            <p className="font-medium">{new Date(user.created_at).toLocaleDateString("pt-PT")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Contas no Dispositivo</p>
                            <p className="font-medium">{user.device_user_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Atividade Recente</p>
                            <p className="font-medium">{user.recent_activity} ações</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dispositivo</p>
                            <p className="font-medium">{user.device_flagged ? "Sinalizado" : "Normal"}</p>
                          </div>
                        </div>

                        {riskLevel === "high" && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Este usuário apresenta múltiplos indicadores de risco e requer atenção imediata.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlagUser(user.id, "Atividade suspeita detectada pelo sistema")}
                            disabled={!user.is_active || actionLoading === user.id}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {actionLoading === user.id ? "Processando..." : "Bloquear"}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
