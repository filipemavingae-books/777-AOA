"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Users, Trophy, Wallet, QrCode } from "lucide-react"
import AuthModal from "@/components/auth-modal"
import AgeVerificationModal from "@/components/age-verification-modal"

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false)
  const [showAgeVerification, setShowAgeVerification] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  const handleGetStarted = () => {
    setShowAgeVerification(true)
  }

  const handleAgeVerified = () => {
    setShowAgeVerification(false)
    setAuthMode("register")
    setShowAuth(true)
  }

  const handleLogin = () => {
    setAuthMode("login")
    setShowAuth(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="blur-backdrop absolute inset-0 bg-background/80" />

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center animate-pulse-glow">
                  <Zap className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="animate-float bg-secondary text-secondary-foreground">
                    18+
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-balance text-foreground">QuizMaster</h1>
              <p className="text-xl md:text-2xl text-muted-foreground text-balance">
                Plataforma de Quiz Competitivo com Carteira Digital
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Teste seus conhecimentos, ganhe prémios reais e transfira dinheiro entre jogadores. Mais de 4.289 mil
                perguntas aleatórias esperando por você!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 animate-pulse-glow" onClick={handleGetStarted}>
                Começar Agora
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-transparent border-border hover:bg-muted"
                onClick={handleLogin}
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Tudo que você precisa para uma experiência de quiz competitivo completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Quiz Competitivo</CardTitle>
                <CardDescription>
                  Mais de 4.289 mil perguntas aleatórias com diferentes níveis de dificuldade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Entrada: 50 AOA por jogo</li>
                  <li>• Prémios reais para vencedores</li>
                  <li>• Rankings em tempo real</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Carteira Digital</CardTitle>
                <CardDescription>
                  Carteira futurista com chip único e número exclusivo para cada usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Design futurista com chip</li>
                  <li>• Número único por usuário</li>
                  <li>• Saques protegidos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Transferências P2P</CardTitle>
                <CardDescription>Transfira dinheiro entre jogadores usando QR Code ou nome de usuário</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• QR Code único por conta</li>
                  <li>• Transferências instantâneas</li>
                  <li>• Mensagens opcionais</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Sistema de Convites</CardTitle>
                <CardDescription>Convide amigos e ganhe bónus quando eles jogarem</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Link único UUID</li>
                  <li>• 5 AOA para ambos</li>
                  <li>• Limite semanal</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Anti-Fraude</CardTitle>
                <CardDescription>Sistema robusto de segurança e prevenção de múltiplas contas</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Verificação de dispositivo</li>
                  <li>• Monitorização de IP</li>
                  <li>• KYC obrigatório</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-card-foreground">Bónus Diários</CardTitle>
                <CardDescription>Sequência de bónus de boas-vindas durante 4 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dia 1: 5 AOA</li>
                  <li>• Dia 2: 2 jogos grátis</li>
                  <li>• Dia 3: 5 USD</li>
                  <li>• Dia 4: 7 AOA + 1 USD</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground">Pronto para Começar?</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Junte-se a milhares de jogadores e comece a ganhar dinheiro real com seus conhecimentos!
            </p>
            <Button size="lg" className="text-lg px-8 py-6 animate-pulse-glow" onClick={handleGetStarted}>
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AgeVerificationModal
        open={showAgeVerification}
        onClose={() => setShowAgeVerification(false)}
        onVerified={handleAgeVerified}
      />

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} mode={authMode} onModeChange={setAuthMode} />
    </div>
  )
}
