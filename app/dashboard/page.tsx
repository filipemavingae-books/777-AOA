"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Send, Trophy, Gift, LogOut, Settings, Zap, Star, Coins, User, Gamepad2 } from "lucide-react"
import { useRouter } from "next/navigation"
import WalletCard from "@/components/wallet-card"
import TransferModal from "@/components/transfer-modal"
import QRCodeModal from "@/components/qr-code-modal"
import TransactionHistory from "@/components/transaction-history"
import BonusCard from "@/components/bonus-card"
import ReferralCard from "@/components/referral-card"
import DailyBonusModal from "@/components/daily-bonus-modal"
import UserSettingsModal from "@/components/user-settings-modal"

interface WalletBalance {
  currency: string
  balance: number
  lockedBalance: number
  nonTransferableBalance: number
  availableBalance: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<any | null>(null)
  const [wallets, setWallets] = useState<WalletBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showDailyBonus, setShowDailyBonus] = useState(false)
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [usdConversionRate, setUsdConversionRate] = useState(0.0011) // 1 AOA = 0.0011 USD
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    fetchWalletBalance()
    checkDailyBonus()
    checkNewUserBonus()
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      router.push("/")
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/wallet/balance")
      const data = await response.json()

      if (data.success) {
        setWallets(data.wallets)
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkNewUserBonus = async () => {
    const hasReceivedBonus = localStorage.getItem("newUserBonus")
    if (!hasReceivedBonus) {
      try {
        const response = await fetch("/api/bonus/new-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
        const data = await response.json()
        if (data.success) {
          localStorage.setItem("newUserBonus", "true")
          alert("Bônus de boas-vindas de 150 AOA adicionado à sua conta!")
          fetchWalletBalance()
        }
      } catch (error) {
        console.error("Erro ao processar bônus de novo usuário:", error)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handlePlayQuiz = () => {
    router.push("/quiz")
  }

  const handlePlayMario = () => {
    router.push("/games/mario")
  }

  const handleBonusClick = () => {
    const bonusCard = document.querySelector("[data-bonus-card]")
    if (bonusCard) {
      bonusCard.scrollIntoView({ behavior: "smooth" })
    }
  }

  const checkDailyBonus = () => {
    const lastBonusDate = localStorage.getItem("lastBonusDate")
    const today = new Date().toDateString()

    if (lastBonusDate !== today) {
      setTimeout(() => {
        setShowDailyBonus(true)
      }, 3000)
    }
  }

  const convertToUSD = async () => {
    const aoaWallet = wallets.find((w) => w.currency === "AOA")
    if (!aoaWallet || aoaWallet.availableBalance <= 3890) {
      alert("Saldo insuficiente em AOA para conversão")
      return
    }

    try {
      const response = await fetch("/api/wallet/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: "AOA",
          toCurrency: "USD",
          amount: aoaWallet.availableBalance,
        }),
      })

      const data = await response.json()
      if (data.success) {
        fetchWalletBalance()
        alert(
          `Conversão realizada com sucesso! ${aoaWallet.availableBalance} AOA → ${(aoaWallet.availableBalance * usdConversionRate).toFixed(2)} USD`,
        )
      }
    } catch (error) {
      console.error("Erro na conversão:", error)
    }
  }

  const aoaWallet = wallets.find((w) => w.currency === "AOA")
  const usdWallet = wallets.find((w) => w.currency === "USD")

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black">
      <header className="border-b border-purple-500/20 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Zap className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                  QuizMaster Pro
                </h1>
                <p className="text-sm text-purple-300">Olá, {user?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {user?.verified && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/30 shadow-lg shadow-green-500/10">
                  <Star className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUserSettings(true)}
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              {user?.is_admin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin")}
                  className="border-purple-500/30 hover:bg-purple-500/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <WalletCard
                currency="AOA"
                balance={aoaWallet?.balance || 150}
                availableBalance={aoaWallet?.availableBalance || 0}
                lockedBalance={aoaWallet?.lockedBalance || 0}
                walletNumber={user?.walletNumber || ""}
                onTransfer={() => setShowTransfer(true)}
                onShowQR={() => setShowQRCode(true)}
              />

              <WalletCard
                currency="USD"
                balance={usdWallet?.balance || 150}
                availableBalance={usdWallet?.availableBalance || 0}
                lockedBalance={usdWallet?.lockedBalance ||0}
                walletNumber={user?.walletNumber || ""}
                onTransfer={() => setShowTransfer(true)}
                onShowQR={() => setShowQRCode(true)}
                disabled={false}
                disabledReason=""
              />
            </div>

            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Zap className="w-5 h-5 mr-2 text-purple-400" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-purple-500/10 to-transparent border-purple-500/30 hover:bg-purple-500/20 hover:scale-105 transition-all"
                    onClick={handlePlayQuiz}
                  >
                    <Trophy className="w-6 h-6 mb-2 text-purple-400" />
                    <span className="text-white">Quiz</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-red-500/10 to-transparent border-red-500/30 hover:bg-red-500/20 hover:scale-105 transition-all"
                    onClick={handlePlayMario}
                  >
                    <Gamepad2 className="w-6 h-6 mb-2 text-red-400" />
                    <span className="text-white">Mario</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-blue-500/10 to-transparent border-blue-500/30 hover:bg-blue-500/20 hover:scale-105 transition-all"
                    onClick={() => setShowTransfer(true)}
                  >
                    <Send className="w-6 h-6 mb-2 text-blue-400" />
                    <span className="text-white">Transferir</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-green-500/10 to-transparent border-green-500/30 hover:bg-green-500/20 hover:scale-105 transition-all"
                    onClick={() => setShowQRCode(true)}
                  >
                    <QrCode className="w-6 h-6 mb-2 text-green-400" />
                    <span className="text-white">Meu QR</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-pink-500/10 to-transparent border-pink-500/30 hover:bg-pink-500/20 hover:scale-105 transition-all"
                    onClick={handleBonusClick}
                  >
                    <Gift className="w-6 h-6 mb-2 text-pink-400" />
                    <span className="text-white">Bónus</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col bg-gradient-to-b from-yellow-500/10 to-transparent border-yellow-500/30 hover:bg-yellow-500/20 hover:scale-105 transition-all"
                    onClick={convertToUSD}
                  >
                    <Coins className="w-6 h-6 mb-2 text-yellow-400" />
                    <span className="text-white">USD</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <TransactionHistory />
          </div>

          <div className="space-y-6">
            <div data-bonus-card>
              <BonusCard />
            </div>

            <ReferralCard />

            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.profileImage && (
                  <div className="flex justify-center">
                    <img
                      src={user.profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-purple-500/30"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-purple-300">Nome de Usuário</p>
                  <p className="font-medium text-white">{user?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Carteira</p>
                  <p className="font-mono text-sm text-white">{user?.walletNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Nível KYC</p>
                  <Badge variant={user?.kycLevel && user.kycLevel > 0 ? "default" : "secondary"}>
                    Nível {user?.kycLevel || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-300">Jogos Jogados</span>
                  <span className="font-medium text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-300">Vitórias</span>
                  <span className="font-medium text-white">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-300">Taxa USD</span>
                  <span className="font-medium text-green-400">{usdConversionRate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSuccess={fetchWalletBalance}
        availableBalance={aoaWallet?.availableBalance || 0}
      />

      <QRCodeModal
        open={showQRCode}
        onClose={() => setShowQRCode(false)}
        qrData={user?.qrCodeData || ""}
        walletNumber={user?.walletNumber || ""}
        username={user?.username || ""}
      />

      <DailyBonusModal
        open={showDailyBonus}
        onClose={() => setShowDailyBonus(false)}
        onClaim={() => 
          setShowDailyBonus(false)
          fetchWalletBalance()
        }}
      />

      <UserSettingsModal
        open={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        user={user}
        onUpdate={fetchUserData}
      />
    </div>
  )
}
