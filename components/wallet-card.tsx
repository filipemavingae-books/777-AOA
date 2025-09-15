"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Send, QrCode, Lock } from "lucide-react"

interface WalletCardProps {
  currency: string
  balance: number
  availableBalance: number
  lockedBalance: number
  walletNumber: string
  onTransfer: () => void
  onShowQR: () => void
  disabled?: boolean
  disabledReason?: string
}

export default function WalletCard({
  currency,
  balance,
  availableBalance,
  lockedBalance,
  walletNumber,
  onTransfer,
  onShowQR,
  disabled = false,
  disabledReason,
}: WalletCardProps) {
  return (
    <Card className={`relative overflow-hidden ${disabled ? "opacity-60" : ""}`}>
      {/* Futuristic chip design */}
      <div className="absolute top-4 right-4 w-12 h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded border border-primary/30 flex items-center justify-center">
        <div className="w-6 h-4 bg-primary/40 rounded-sm flex items-center justify-center">
          <div className="w-3 h-2 bg-primary rounded-xs"></div>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Wallet className="w-5 h-5 mr-2" />
            Carteira {currency}
          </CardTitle>
          {disabled && disabledReason && (
            <Badge variant="secondary" className="text-xs">
              Em breve
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-2">
          <div>
            <p className="text-2xl font-bold text-balance">
              {balance.toFixed(2)} {currency}
            </p>
            <p className="text-sm text-muted-foreground">Saldo Total</p>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Disponível:</span>
            <span className="font-medium text-green-600">
              {availableBalance.toFixed(2)} {currency}
            </span>
          </div>

          {lockedBalance > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center">
                <Lock className="w-3 h-3 mr-1" />
                Bloqueado:
              </span>
              <span className="font-medium text-orange-600">
                {lockedBalance.toFixed(2)} {currency}
              </span>
            </div>
          )}
        </div>

        {/* Wallet Number */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Número da Carteira</p>
          <p className="font-mono text-sm font-medium">{walletNumber}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onTransfer} disabled={disabled || availableBalance <= 2}>
            <Send className="w-4 h-4 mr-2" />
            Transferir
          </Button>
          <Button size="sm" variant="outline" onClick={onShowQR} disabled={disabled}>
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {disabled && disabledReason && <p className="text-xs text-muted-foreground text-center">{disabledReason}</p>}
      </CardContent>
    </Card>
  )
}
