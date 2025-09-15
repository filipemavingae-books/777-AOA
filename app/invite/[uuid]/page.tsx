"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Users, ArrowRight } from "lucide-react"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const [inviteData, setInviteData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const response = await fetch(`/api/referrals/validate/${params.uuid}`)
        const data = await response.json()

        if (data.success) {
          setInviteData(data)
          // Store invite UUID in localStorage for registration
          localStorage.setItem("invite_uuid", params.uuid as string)
        }
      } catch (error) {
        console.error("Error fetching invite data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.uuid) {
      fetchInviteData()
    }
  }, [params.uuid])

  const handleJoin = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Convite Inválido</h1>
            <p className="text-muted-foreground mb-6">Este link de convite não é válido ou expirou.</p>
            <Button onClick={() => router.push("/")}>Ir para Homepage</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-green-100 text-green-800">
              <Gift className="w-4 h-4 mr-2" />
              Convite Especial
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Você foi convidado para o<span className="text-primary"> QuizMaster</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              {inviteData.inviterUsername} te convidou para participar da plataforma de quiz mais competitiva de Angola!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="flex items-center space-x-2 text-green-600">
                <Gift className="w-5 h-5" />
                <span className="font-medium">Bónus de 5 AOA para ambos</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">Comunidade ativa</span>
              </div>
            </div>

            <Button size="lg" onClick={handleJoin} className="text-lg px-8 py-6">
              Aceitar Convite
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-6 h-6 mr-2 text-green-500" />
                Bónus de Boas-Vindas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receba bónus diários por 4 dias consecutivos, incluindo AOA e jogos grátis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-blue-500" />
                Referral Bonus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Você e {inviteData.inviterUsername} receberão 5 AOA quando você jogar seu primeiro jogo pago.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="w-6 h-6 mr-2 text-primary" />
                Começar Agora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Registre-se agora e comece a competir em quizzes com prémios reais em AOA.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
