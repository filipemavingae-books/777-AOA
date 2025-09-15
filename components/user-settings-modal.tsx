"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, CreditCard, FileText, Upload, Camera } from "lucide-react"

interface UserSettingsModalProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    username: string
    email: string
    fullName: string
    profileImage?: string
    iban?: string
    kycLevel: number
  } | null
  onUpdate: () => void
}

export default function UserSettingsModal({ open, onClose, user, onUpdate }: UserSettingsModalProps) {
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    iban: user?.iban || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [documentVerification, setDocumentVerification] = useState({
    score: 0,
    status: "pending",
    message: "",
  })

  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()
      if (data.success) {
        alert("Perfil atualizado com sucesso!")
        onUpdate()
      } else {
        alert(data.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      alert("Erro ao atualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert("Senha atualizada com sucesso!")
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        alert(data.error || "Erro ao atualizar senha")
      }
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      alert("Erro ao atualizar senha")
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("document", file)

    setLoading(true)
    try {
      const response = await fetch("/api/user/verify-document", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setDocumentVerification({
          score: data.score,
          status: data.status,
          message: data.message,
        })
        onUpdate()
      } else {
        alert(data.error || "Erro ao verificar documento")
      }
    } catch (error) {
      console.error("Erro ao verificar documento:", error)
      alert("Erro ao verificar documento")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("profileImage", file)

    setLoading(true)
    try {
      const response = await fetch("/api/user/update-profile-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        alert("Foto de perfil atualizada com sucesso!")
        onUpdate()
      } else {
        alert(data.error || "Erro ao atualizar foto de perfil")
      }
    } catch (error) {
      console.error("Erro ao atualizar foto de perfil:", error)
      alert("Erro ao atualizar foto de perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-black via-purple-950/50 to-black border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center">
            <Camera className="w-6 h-6 mr-2 text-purple-400" />
            Configurações do Perfil
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/40">
            <TabsTrigger value="profile" className="text-white">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white">
              Segurança
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-white">
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="verification" className="text-white">
              Verificação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-purple-400" />
                  Foto de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-purple-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-purple-400" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="profileImage" className="cursor-pointer">
                      <Button variant="outline" className="border-purple-500/30 bg-transparent" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Alterar Foto
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-purple-300">
                    Nome de Usuário
                  </Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-purple-300">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-purple-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Atualizar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-purple-400" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-purple-300">
                    Senha Atual
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-purple-300">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-purple-300">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                </div>
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="iban" className="text-purple-300">
                    IBAN
                  </Label>
                  <Input
                    id="iban"
                    value={profileData.iban}
                    onChange={(e) => setProfileData({ ...profileData, iban: e.target.value })}
                    className="bg-black/20 border-purple-500/30 text-white"
                    placeholder="AO06 0000 0000 0000 0000 0000 0"
                  />
                </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Atualizar IBAN
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-400" />
                  Verificação de Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge variant={user?.kycLevel && user.kycLevel > 0 ? "default" : "secondary"} className="mb-4">
                    Nível KYC: {user?.kycLevel || 0}
                  </Badge>
                </div>

                {documentVerification.score > 0 && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple-300">Confiabilidade do Documento:</span>
                      <Badge
                        variant={
                          documentVerification.score >= 80
                            ? "default"
                            : documentVerification.score >= 60
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {documentVerification.score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-white">{documentVerification.message}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="document" className="text-purple-300">
                    Upload do BI/Documento
                  </Label>
                  <Input
                    id="document"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleDocumentUpload}
                    className="bg-black/20 border-purple-500/30 text-white"
                  />
                  <p className="text-xs text-purple-400 mt-1">Formatos aceitos: JPG, PNG, PDF. Máximo 5MB.</p>
                </div>

                <div className="text-sm text-purple-300">
                  <p>• Nível 0: Não verificado</p>
                  <p>• Nível 1: Documento básico (60-79% confiável)</p>
                  <p>• Nível 2: Documento verificado (80-100% confiável)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
