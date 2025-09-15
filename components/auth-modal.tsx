"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, User, Mail, Phone, CreditCard, FileText, Loader2, Gift } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  open: boolean
  onClose: () => void
  mode: "login" | "register"
  onModeChange: (mode: "login" | "register") => void
}

export default function AuthModal({ open, onClose, mode, onModeChange }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    birthDate: "",
    iban: "",
    identityDocument: "",
    inviteCode: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState("")

  useEffect(() => {
    const inviteCode = localStorage.getItem("invite_uuid")
    if (inviteCode && mode === "register") {
      setFormData((prev) => ({ ...prev, inviteCode }))
    }
  }, [mode])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (generalError) setGeneralError("")
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (mode === "register") {
      if (!formData.username) {
        newErrors.username = "Nome de usuário é obrigatório"
      } else if (formData.username.length < 3) {
        newErrors.username = "Nome de usuário deve ter pelo menos 3 caracteres"
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = "Nome de usuário deve conter apenas letras, números e underscore"
      }

      if (!formData.email) {
        newErrors.email = "Email é obrigatório"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email inválido"
      }

      if (!formData.phone) {
        newErrors.phone = "Telefone é obrigatório"
      } else {
        const cleanPhone = formData.phone.replace(/\s/g, "")
        if (!/^(\+244|244)?[0-9]{9}$/.test(cleanPhone)) {
          newErrors.phone = "Telefone deve ser um número angolano válido"
        }
      }

      if (!formData.fullName) {
        newErrors.fullName = "Nome completo é obrigatório"
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "Nome completo deve ter pelo menos 2 caracteres"
      }

      if (!formData.birthDate) {
        newErrors.birthDate = "Data de nascimento é obrigatória"
      } else {
        try {
          const birthDate = new Date(formData.birthDate)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }

          if (age < 18) {
            newErrors.birthDate = "Você deve ter pelo menos 18 anos"
          }
        } catch {
          newErrors.birthDate = "Data de nascimento inválida"
        }
      }

      if (!formData.password) {
        newErrors.password = "Senha é obrigatória"
      } else if (formData.password.length < 6) {
        newErrors.password = "Senha deve ter pelo menos 6 caracteres"
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem"
      }

      if (formData.iban && formData.iban.trim()) {
        const cleanIban = formData.iban.replace(/\s/g, "")
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(cleanIban)) {
          newErrors.iban = "IBAN inválido"
        }
      }
    }

    if (!formData.password) newErrors.password = "Senha é obrigatória"
    if (mode === "login" && !formData.email) newErrors.email = "Email é obrigatório"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setGeneralError("")

    try {
      let deviceFingerprint
      try {
        deviceFingerprint = generateDeviceFingerprint()
      } catch (fingerprintError) {
        console.warn("Device fingerprint generation failed:", fingerprintError)
        deviceFingerprint = `fallback-${Date.now()}`
      }

      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            deviceFingerprint,
          }),
        })

        const data = await response.json()

        if (data.success) {
          localStorage.removeItem("invite_uuid")
          onClose()
          router.push("/dashboard")
        } else {
          if (data.errors) {
            setErrors(data.errors)
          } else {
            setGeneralError(data.error || "Erro ao criar conta")
          }
        }
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            deviceFingerprint,
          }),
        })

        const data = await response.json()

        if (data.success) {
          onClose()
          router.push("/dashboard")
        } else {
          setGeneralError(data.error || "Erro ao fazer login")
        }
      }
    } catch (error) {
      console.error("Auth error:", error)
      setGeneralError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto blur-backdrop">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">{mode === "login" ? "Entrar na Conta" : "Criar Conta"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Entre com suas credenciais para acessar sua conta"
              : "Preencha todos os dados para criar sua conta"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => onModeChange(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Registrar</TabsTrigger>
          </TabsList>

          {generalError && (
            <Alert variant="destructive">
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loginEmail"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className="pr-10"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {formData.inviteCode && (
              <Alert className="bg-green-50 border-green-200">
                <Gift className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Você foi convidado! Receberá bónus especiais ao completar o registro.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="usuario123"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    disabled={loading}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="João Silva"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  disabled={loading}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="+244 900 000 000"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                disabled={loading}
              />
              {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    className="pr-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme a senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={loading}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            {!formData.inviteCode && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Código de Convite (Opcional)</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="inviteCode"
                    placeholder="Código de convite de um amigo"
                    className="pl-10"
                    value={formData.inviteCode}
                    onChange={(e) => handleInputChange("inviteCode", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN (Opcional)</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="iban"
                  placeholder="AO06 0000 0000 0000 0000 0000 0"
                  className="pl-10"
                  value={formData.iban}
                  onChange={(e) => handleInputChange("iban", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.iban && <p className="text-sm text-destructive">{errors.iban}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="identityDocument">Bilhete de Identidade (Opcional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identityDocument"
                  placeholder="000000000LA000"
                  className="pl-10"
                  value={formData.identityDocument}
                  onChange={(e) => handleInputChange("identityDocument", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                Ao criar uma conta, você concorda com nossos termos de serviço e política de privacidade. Apenas maiores
                de 18 anos podem usar esta plataforma.
              </AlertDescription>
            </Alert>

            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Criando Conta..." : "Criar Conta"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
