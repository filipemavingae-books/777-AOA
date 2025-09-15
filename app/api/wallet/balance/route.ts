import { type NextRequest, NextResponse } from "next/server"
import { getUserWallets } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
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

    const wallets = await getUserWallets(decoded.userId)

    return NextResponse.json({
      success: true,
      wallets: wallets.map((wallet) => ({
        currency: wallet.currency,
        balance: Number.parseFloat(wallet.balance),
        lockedBalance: Number.parseFloat(wallet.locked_balance),
        nonTransferableBalance: Number.parseFloat(wallet.non_transferable_balance),
        availableBalance:
          Number.parseFloat(wallet.balance) -
          Number.parseFloat(wallet.locked_balance) -
          Number.parseFloat(wallet.non_transferable_balance),
      })),
    })
  } catch (error) {
    console.error("Get balance error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
