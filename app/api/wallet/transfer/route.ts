import { type NextRequest, NextResponse } from "next/server"
import { createTransfer, getUserByUsername, getUserByWalletNumber, checkDailyTransferLimit } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

const DAILY_TRANSFER_LIMIT = 1000 // AOA
const TRANSFER_FEE = 2 // AOA

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

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

    const { recipient, amount, message } = await request.json()

    if (!recipient || !amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
        },
        { status: 400 },
      )
    }

    if (amount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor mínimo de transferência é 1 AOA",
        },
        { status: 400 },
      )
    }

    // Check daily limit
    const dailyTotal = await checkDailyTransferLimit(decoded.userId)
    if (dailyTotal + amount + TRANSFER_FEE > DAILY_TRANSFER_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite diário de transferências excedido (${DAILY_TRANSFER_LIMIT} AOA)`,
        },
        { status: 400 },
      )
    }

    // Find recipient by username or wallet number
    let recipientUser = await getUserByUsername(recipient)
    if (!recipientUser) {
      recipientUser = await getUserByWalletNumber(recipient)
    }

    if (!recipientUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário destinatário não encontrado",
        },
        { status: 404 },
      )
    }

    if (recipientUser.id === decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Não é possível transferir para si mesmo",
        },
        { status: 400 },
      )
    }

    // Create transfer
    const transfer = await createTransfer({
      fromUserId: decoded.userId,
      toUserId: recipientUser.id,
      amount: Number.parseFloat(amount),
      fee: TRANSFER_FEE,
      currency: "AOA",
      message,
    })

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        amount: Number.parseFloat(amount),
        fee: TRANSFER_FEE,
        recipient: recipientUser.username,
        message,
        createdAt: transfer.created_at,
      },
    })
  } catch (error: any) {
    console.error("Transfer error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
