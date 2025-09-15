"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History, ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  created_at: string
  category: string
  other_username?: string
  message?: string
}

export default function TransactionHistory() {
  const [history, setHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/wallet/history")
      const data = await response.json()

      if (data.success) {
        setHistory(data.history)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "sent":
      case "transfer_out":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />
      case "received":
      case "transfer_in":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />
      default:
        return <History className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Concluído
          </Badge>
        )
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const transfers = history.filter((h) => h.category === "transfer")
  const transactions = history.filter((h) => h.category === "transaction")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="w-5 h-5 mr-2" />
          Histórico de Transações
        </CardTitle>
        <CardDescription>Acompanhe todas as suas transferências e transações</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="transfers">Transferências</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(item.type)}
                      <div>
                        <p className="font-medium">
                          {item.type === "sent"
                            ? `Enviado para @${item.other_username}`
                            : item.type === "received"
                              ? `Recebido de @${item.other_username}`
                              : item.type}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatDate(item.created_at)}</p>
                        {item.message && <p className="text-sm text-muted-foreground italic">"{item.message}"</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          item.type === "sent" || item.type === "transfer_out" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {item.type === "sent" || item.type === "transfer_out" ? "-" : "+"}
                        {item.amount.toFixed(2)} {item.currency}
                      </p>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transfers" className="space-y-4">
            {transfers.length === 0 ? (
              <div className="text-center py-8">
                <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transferência encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transfers.slice(0, 10).map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transfer.type)}
                      <div>
                        <p className="font-medium">
                          {transfer.type === "sent"
                            ? `Para @${transfer.other_username}`
                            : `De @${transfer.other_username}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatDate(transfer.created_at)}</p>
                        {transfer.message && (
                          <p className="text-sm text-muted-foreground italic">"{transfer.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transfer.type === "sent" ? "text-red-600" : "text-green-600"}`}>
                        {transfer.type === "sent" ? "-" : "+"}
                        {transfer.amount.toFixed(2)} {transfer.currency}
                      </p>
                      {getStatusBadge(transfer.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {transaction.amount.toFixed(2)} {transaction.currency}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
