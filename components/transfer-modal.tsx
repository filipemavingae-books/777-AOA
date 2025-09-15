"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, User, Loader2, AlertTriangle } from "lucide-react"

interface TransferModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  availableBalance: number
}

export default function TransferModal({ open, onClose, onSuccess, availableBalance }: TransferModalProps) {
  const [formData, setFormData] = useState({
    recipient: "",
    amount: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const TRANSFER_FEE = 2
  const DAILY_LIMIT = 1000

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (success) setSuccess(false)
  }

  const validateForm = () => {
    if (!formData.recipient.trim()) {
      setError("Nome de usuário ou número da carteira é obrigatório")
      return false
    }

    const amount = Number.parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      setError("Valor deve ser maior que zero")
      return false
    }

    if (amount < 1) {
      setError("Valor mínimo de transferência é 1 AOA")
      return false
    }

    if (amount + TRANSFER_FEE > availableBalance) {
      setError("Saldo insuficiente (incluindo taxa de 2 AOA)")
      return false
    }

    if (amount > DAILY_LIMIT) {
      setError(`Valor excede o limite diário de ${DAILY_LIMIT} AOA`)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: formData.recipient.trim(),
          amount: Number.parseFloat(formData.amount),
          message: formData.message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({ recipient: "", amount: "", message: "" })
        onSuccess()

        // Auto close after 2 seconds
        setTimeout(() => {
          setSuccess(false)
          onClose()
        }, 2000)
      } else {
        setError(data.error || "Erro ao processar transferência")
      }
    } catch (error) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ recipient: "", amount: "", message: "" })
      setError("")
      setSuccess(false)
      onClose()
    }
  }

  const totalAmount = Number.parseFloat(formData.amount) + TRANSFER_FEE || TRANSFER_FEE

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md blur-backdrop">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Transferir Dinheiro</DialogTitle>
          <DialogDescription>
            Envie dinheiro para outro jogador usando nome de usuário ou número da carteira
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">Transferência Realizada!</h3>
            <p className="text-sm text-muted-foreground">{formData.amount} AOA enviados com sucesso</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Saldo disponível: {availableBalance.toFixed(2)} AOA • Taxa: {TRANSFER_FEE} AOA • Limite diário:{" "}
                {DAILY_LIMIT} AOA
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Nome de usuário ou número da carteira"
                  className="pl-10"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange("recipient", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (AOA)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                disabled={loading}
              />
              {formData.amount && (
                <p className="text-sm text-muted-foreground">Total com taxa: {totalAmount.toFixed(2)} AOA</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem (Opcional)</Label>
              <Textarea
                id="message"
                placeholder="Adicione uma mensagem..."
                className="resize-none"
                rows={3}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                disabled={loading}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.message.length}/200</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent" disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Enviando..." : "Transferir"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
