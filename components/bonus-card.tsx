"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Calendar, Star, Coins } from "lucide-react"

interface BonusData {
  canClaim: boolean
  bonusAmount: number
  bonusType: string
  daysSinceRegistration: number
  consecutiveDays: number
}

export default function BonusCard() {
  const [bonusData, setBonusData] = useState<BonusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    fetchBonusData()
  }, [])

  const fetchBonusData = async () => {
    try {
      const response = await fetch("/api/bonuses/daily")
      const data = await response.json()

      if (data.success) {
        setBonusData(data)
      }
    } catch (error) {
      console.error("Error fetching bonus data:", error)
    } finally {
      setLoading(false)
    }
  }

  const claimBonus = async () => {
    setClaiming(true)
    try {
      const response = await fetch("/api/bonuses/daily", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        fetchBonusData() // Refresh data
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Error claiming bonus:", error)
      alert("Erro ao coletar bónus")
    } finally {
      setClaiming(false)
    }
  }

  const getBonusDescription = (type: string, day: number) => {
    switch (type) {
      case "welcome_day1":
        return "Bónus de boas-vindas - 5 AOA"
      case "free_games":
        return "2 jogos grátis (válidos por 7 dias)"
      case "usd_bonus":
        return "5 USD (conversível após 7 dias)"
      case "mixed_bonus":
        return "7 AOA + 1 USD"
      case "daily_regular":
        return `Bónus diário - ${bonusData?.bonusAmount} AOA`
      default:
        return "Nenhum bónus disponível hoje"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bonusData) return null

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Gift className="w-6 h-6 mr-2 text-primary" />
            Bónus Diário
          </div>
          <Badge variant={bonusData.canClaim ? "default" : "secondary"}>
            Dia {bonusData.daysSinceRegistration + 1}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {getBonusDescription(bonusData.bonusType, bonusData.daysSinceRegistration)}
          </p>

          {bonusData.bonusAmount > 0 && bonusData.canClaim && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Coins className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-primary">
                {bonusData.bonusAmount} {bonusData.bonusType === "usd_bonus" ? "USD" : "AOA"}
              </span>
            </div>
          )}
        </div>

        {bonusData.consecutiveDays > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{bonusData.consecutiveDays} dias consecutivos</span>
          </div>
        )}

        <Button onClick={claimBonus} disabled={!bonusData.canClaim || claiming} className="w-full" size="lg">
          <Calendar className="w-4 h-4 mr-2" />
          {claiming ? "Coletando..." : bonusData.canClaim ? "Coletar Bónus" : "Já Coletado Hoje"}
        </Button>

        {bonusData.daysSinceRegistration < 4 && (
          <div className="text-center text-xs text-muted-foreground">
            <p>Próximo bónus em {24 - new Date().getHours()} horas</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
