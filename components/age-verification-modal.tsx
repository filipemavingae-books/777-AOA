"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AgeVerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified: () => void
}

export default function AgeVerificationModal({ open, onClose, onVerified }: AgeVerificationModalProps) {
  const [birthDate, setBirthDate] = useState("")
  const [error, setError] = useState("")

  const handleVerify = () => {
    if (!birthDate) {
      setError("Por favor, insira sua data de nascimento")
      return
    }

    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 18) {
      setError("Você deve ter pelo menos 18 anos para usar esta plataforma")
      return
    }

    setError("")
    onVerified()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md blur-backdrop">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Verificação de Idade</DialogTitle>
          <DialogDescription className="text-base">
            Esta plataforma é restrita a maiores de 18 anos. Por favor, confirme sua data de nascimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Apenas usuários com 18 anos ou mais podem acessar esta plataforma de jogos.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="text-base"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleVerify} className="flex-1">
              Verificar Idade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
