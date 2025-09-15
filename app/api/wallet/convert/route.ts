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

    const { fromCurrency, toCurrency, amount } = await request.json()

    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 })
    }

    // Conversion rate: 1 AOA = 0.0011 USD
    const conversionRate = fromCurrency === "AOA" && toCurrency === "USD" ? 0.0011 : 909.09

    const convertedAmount = amount * conversionRate

    // Start transaction
    await sql`BEGIN`

    try {
      // Deduct from source currency
      const deductResult = await sql`
        UPDATE wallets 
        SET balance = balance - ${amount},
            available_balance = available_balance - ${amount}
        WHERE user_id = ${decoded.userId} 
        AND currency = ${fromCurrency}
        AND available_balance >= ${amount}
        RETURNING *
      `

      if (deductResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json({ success: false, error: "Saldo insuficiente" }, { status: 400 })
      }

      // Add to target currency
      await sql`
        UPDATE wallets 
        SET balance = balance + ${convertedAmount},
            available_balance = available_balance + ${convertedAmount}
        WHERE user_id = ${decoded.userId} AND currency = ${toCurrency}
      `

      // Record conversion transaction
      await sql`
        INSERT INTO transactions (user_id, type, amount, currency, description, status)
        VALUES 
        (${decoded.userId}, 'conversion_out', ${amount}, ${fromCurrency}, 'Conversão ${fromCurrency} para ${toCurrency}', 'completed'),
        (${decoded.userId}, 'conversion_in', ${convertedAmount}, ${toCurrency}, 'Conversão ${fromCurrency} para ${toCurrency}', 'completed')
      `

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        message: "Conversão realizada com sucesso",
        convertedAmount: convertedAmount,
        rate: conversionRate,
      })
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Erro na conversão:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
