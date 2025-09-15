"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Gift, Calendar, Coins, Star } from "lucide-react"

interface DailyBonusModalProps {
  open: boolean
  onClose: () => void
  onClaim: () => void
}

export default function DailyBonusModal({ open, onClose, onClaim }: DailyBonusModalProps) {
  const [currentDay, setCurrentDay] = useState(1)
  const [claimed, setClaimed] = useState(false)

  const bonusRewards = [
    { day: 1, amount: 10, type: "AOA" },
    { day: 2, amount: 15, type: "AOA" },
    { day: 3, amount: 20, type: "AOA" },
    { day: 4, amount: 25, type: "AOA" },
    { day: 5, amount: 30, type: "AOA" },
    { day: 6, amount: 40, type: "AOA" },
    { day: 7, amount: 100, type: "AOA", special: true },
  ]

  useEffect(() => {
    if (open) {
      const lastBonusDate = localStorage.getItem("lastBonusDate")
      const bonusStreak = Number.parseInt(localStorage.getItem("bonusStreak") || "0")
      const today = new Date().toDateString()

      if (lastBonusDate !== today) {
        setCurrentDay(bonusStreak + 1 > 7 ? 1 : bonusStreak + 1)
        setClaimed(false)
      }
    }
  }, [open])

  const handleClaim = async () => {
    try {
      const response = await fetch("/api/bonus/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: currentDay }),
      })

      const data = await response.json()
      if (data.success) {
        localStorage.setItem("lastBonusDate", new Date().toDateString())
        localStorage.setItem("bonusStreak", currentDay.toString())
        setClaimed(true)

        alert(`Bônus de ${data.amount} AOA adicionado à sua conta!`)

        // Refresh the page to update wallet balance
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        alert(data.error || "Erro ao reivindicar bônus")
      }
    } catch (error) {
      console.error("Erro ao reivindicar bônus:", error)
      alert("Erro ao reivindicar bônus")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-black via-purple-950/50 to-black border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center">
            <Gift className="w-6 h-6 mr-2 text-purple-400" />
            Bônus Diário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-white">Dia {currentDay} de 7</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {bonusRewards.map((reward) => (
              <Card
                key={reward.day}
                className={`
                  ${reward.day === currentDay ? "border-purple-500 bg-purple-500/20" : "border-gray-600 bg-gray-800/50"}
                  ${reward.day < currentDay ? "border-green-500 bg-green-500/20" : ""}
                  ${reward.special ? "border-yellow-500" : ""}
                `}
              >
                <CardContent className="p-2 text-center">
                  <div className="text-xs text-gray-400">Dia {reward.day}</div>
                  <div className="flex items-center justify-center mt-1">
                    {reward.special ? (
                      <Star className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Coins className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="text-xs text-white font-medium">{reward.amount}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white mb-2">{bonusRewards[currentDay - 1]?.amount} AOA</div>
              <div className="text-purple-300 mb-4">
                {bonusRewards[currentDay - 1]?.special ? "Bônus Especial!" : "Recompensa Diária"}
              </div>

              {!claimed ? (
                <Button
                  onClick={handleClaim}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Reivindicar Bônus
                </Button>
              ) : (
                <div className="text-green-400 font-medium">✓ Bônus Reivindicado!</div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-xs text-gray-400">Volte amanhã para o próximo bônus!</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
