"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, Copy, Share } from "lucide-react"
import { useState } from "react"

interface QRCodeModalProps {
  open: boolean
  onClose: () => void
  qrData: string
  walletNumber: string
  username: string
}

export default function QRCodeModal({ open, onClose, qrData, walletNumber, username }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Minha Carteira QuizMaster",
          text: `Envie dinheiro para @${username}`,
          url: `https://quizmaster.app/transfer/${walletNumber}`,
        })
      } catch (error) {
        console.error("Failed to share:", error)
      }
    }
  }

  // Generate QR Code SVG (simplified version)
  const generateQRCodeSVG = (data: string) => {
    // This is a simplified QR code representation
    // In production, use a proper QR code library like qrcode
    const size = 200
    const modules = 25
    const moduleSize = size / modules

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`

    // Generate a pattern based on the data (simplified)
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        const hash = (data.charCodeAt((i * modules + j) % data.length) + i + j) % 2
        if (hash === 1) {
          svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="currentColor"/>`
        }
      }
    }

    svg += "</svg>"
    return svg
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md blur-backdrop">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Meu QR Code</DialogTitle>
          <DialogDescription>Outros jogadores podem escanear este código para te enviar dinheiro</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <Card className="bg-white">
            <CardContent className="p-8 flex flex-col items-center">
              <div
                className="w-48 h-48 flex items-center justify-center text-black"
                dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(qrData) }}
              />
              <p className="text-sm text-gray-600 mt-4 font-mono">{qrData}</p>
            </CardContent>
          </Card>

          {/* User Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Nome de Usuário</p>
                <p className="font-medium">@{username}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(username)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Número da Carteira</p>
                <p className="font-mono text-sm">{walletNumber}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(walletNumber)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {copied && <p className="text-sm text-green-600 text-center">Copiado para a área de transferência!</p>}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Fechar
            </Button>
            {navigator.share && (
              <Button onClick={handleShare} className="flex-1">
                <Share className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
