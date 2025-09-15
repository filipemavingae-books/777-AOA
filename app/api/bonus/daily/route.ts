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

    const { day } = await request.json()

    if (!day || day < 1 || day > 7) {
      return NextResponse.json({ success: false, error: "Dia inválido" }, { status: 400 })
    }

    // Check if user already claimed bonus today
    const today = new Date().toDateString()
    const existingBonus = await sql`
      SELECT * FROM daily_bonuses 
      WHERE user_id = ${decoded.userId} 
      AND DATE(claimed_at) = CURRENT_DATE
    `

    if (existingBonus.length > 0) {
      return NextResponse.json({ success: false, error: "Bônus já reivindicado hoje" }, { status: 400 })
    }

    const bonusAmounts = [10, 15, 20, 25, 30, 40, 100]
    const bonusAmount = bonusAmounts[day - 1]

    // Add bonus to user's wallet
    await sql`
      UPDATE wallets 
      SET balance = balance + ${bonusAmount},
          available_balance = available_balance + ${bonusAmount}
      WHERE user_id = ${decoded.userId} AND currency = 'AOA'
    `

    // Record the bonus claim
    await sql`
      INSERT INTO daily_bonuses (user_id, day, amount, claimed_at)
      VALUES (${decoded.userId}, ${day}, ${bonusAmount}, NOW())
    `

    // Add transaction record
    await sql`
      INSERT INTO transactions (user_id, type, amount, currency, description, status)
      VALUES (${decoded.userId}, 'bonus', ${bonusAmount}, 'AOA', 'Bônus diário dia ${day}', 'completed')
    `

    return NextResponse.json({
      success: true,
      message: "Bônus reivindicado com sucesso",
      amount: bonusAmount,
      day: day,
    })
  } catch (error) {
    console.error("Erro ao processar bônus diário:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
