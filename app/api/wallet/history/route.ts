import { type NextRequest, NextResponse } from "next/server"
import { getTransferHistory, getTransactionHistory } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token não encontrado",
        },
        { status: 401 },
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido",
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const history = []

    if (type === "transfers" || type === "all") {
      const transfers = await getTransferHistory(decoded.userId, limit)
      history.push(
        ...transfers.map((t) => ({
          ...t,
          category: "transfer",
        })),
      )
    }

    if (type === "transactions" || type === "all") {
      const transactions = await getTransactionHistory(decoded.userId, limit)
      history.push(
        ...transactions.map((t) => ({
          ...t,
          category: "transaction",
        })),
      )
    }

    // Sort by date
    history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      history: history.slice(0, limit),
    })
  } catch (error) {
    console.error("Get history error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
