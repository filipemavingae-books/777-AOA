"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Share2, Copy, Gift } from "lucide-react"

interface ReferralStats {
  activeReferrals: number
  totalReferrals: number
  totalEarned: number
  weeklyEarned: number
  weeklyLimit: number
}

export default function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [inviteLink, setInviteLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const [statsResponse, linkResponse] = await Promise.all([
        fetch("/api/referrals/stats"),
        fetch("/api/referrals/create", { method: "POST" }),
      ])

      const [statsData, linkData] = await Promise.all([statsResponse.json(), linkResponse.json()])

      if (statsData.success) {
        setStats(statsData.stats)
      }

      if (linkData.success) {
        setInviteLink(linkData.inviteLink)
      }
    } catch (error) {
      console.error("Error fetching referral data:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Junte-se ao QuizMaster",
          text: "Participe da plataforma de quiz mais competitiva de Angola!",
          url: inviteLink,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyToClipboard()
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-6 h-6 mr-2 text-primary" />
          Sistema de Convites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.activeReferrals}</p>
              <p className="text-sm text-muted-foreground">Convites Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalEarned} AOA</p>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
            </div>
          </div>
        )}

        {/* Weekly Progress */}
        {stats && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ganhos Semanais</span>
              <span>
                {stats.weeklyEarned}/{stats.weeklyLimit} AOA
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((stats.weeklyEarned / stats.weeklyLimit) * 100, 100)}%` }}
              ></div>
            </div>
            {stats.weeklyEarned >= stats.weeklyLimit && (
              <Badge variant="secondary" className="w-full justify-center">
                Limite semanal atingido
              </Badge>
            )}
          </div>
        )}

        {/* Invite Link */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Seu Link de Convite</label>
          <div className="flex space-x-2">
            <Input value={inviteLink} readOnly className="text-xs" />
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={shareLink} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        {/* Bonus Info */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Gift className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Como Funciona</p>
              <p className="text-muted-foreground">
                Convide amigos e ganhe 5 AOA quando eles jogarem seu primeiro jogo pago. Limite de 50 AOA por semana.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
