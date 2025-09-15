import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    // Check if user already received new user bonus
    const existingBonus = await sql`
      SELECT * FROM transactions 
      WHERE user_id = ${decoded.userId} 
      AND type = 'new_user_bonus'
    `

    if (existingBonus.length > 0) {
      return NextResponse.json({ success: false, error: "Bônus já recebido" }, { status: 400 })
    }

    const bonusAmount = 150

    // Add bonus to user's wallet
    await sql`
      UPDATE wallets 
      SET balance = balance + ${bonusAmount},
          available_balance = available_balance + ${bonusAmount}
      WHERE user_id = ${decoded.userId} AND currency = 'AOA'
    `

    // Record the bonus transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, currency, description, status)
      VALUES (${decoded.userId}, 'new_user_bonus', ${bonusAmount}, 'AOA', 'Bônus de boas-vindas', 'completed')
    `

    return NextResponse.json({
      success: true,
      message: "Bônus de novo usuário adicionado com sucesso",
      amount: bonusAmount,
    })
  } catch (error) {
    console.error("Erro ao processar bônus de novo usuário:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
