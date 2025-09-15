import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if user has claimed today's bonus
    const today = new Date().toISOString().split("T")[0]
    const [existingBonus] = await sql`
      SELECT * FROM transactions 
      WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = ${user.id} AND currency = 'AOA')
      AND tx_type = 'daily_bonus'
      AND DATE(created_at) = ${today}
    `

    // Calculate consecutive days
    const consecutiveDays = await sql`
      SELECT COUNT(*) as days FROM (
        SELECT DISTINCT DATE(created_at) as bonus_date
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = ${user.id}
        AND t.tx_type = 'daily_bonus'
        AND t.status = 'completed'
        AND DATE(t.created_at) >= ${today}::date - INTERVAL '7 days'
        ORDER BY bonus_date DESC
      ) consecutive_check
    `

    const daysSinceRegistration = Math.floor(
      (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    // Determine bonus based on day since registration
    let bonusAmount = 0
    let bonusType = "none"
    const canClaim = !existingBonus

    if (daysSinceRegistration === 0 && canClaim) {
      bonusAmount = 5
      bonusType = "welcome_day1"
    } else if (daysSinceRegistration === 1 && canClaim) {
      bonusType = "free_games"
      bonusAmount = 2 // 2 free games
    } else if (daysSinceRegistration === 2 && canClaim) {
      bonusAmount = 5
      bonusType = "usd_bonus"
    } else if (daysSinceRegistration === 3 && canClaim) {
      bonusAmount = 7
      bonusType = "mixed_bonus"
    } else if (canClaim && daysSinceRegistration > 3) {
      bonusAmount = 2 + Math.min(consecutiveDays[0].days, 5) // Base 2 AOA + consecutive bonus
      bonusType = "daily_regular"
    }

    return NextResponse.json({
      success: true,
      canClaim,
      bonusAmount,
      bonusType,
      daysSinceRegistration,
      consecutiveDays: consecutiveDays[0].days,
    })
  } catch (error) {
    console.error("Error checking daily bonus:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Check if already claimed today
    const today = new Date().toISOString().split("T")[0]
    const [existingBonus] = await sql`
      SELECT * FROM transactions 
      WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = ${user.id} AND currency = 'AOA')
      AND tx_type = 'daily_bonus'
      AND DATE(created_at) = ${today}
    `

    if (existingBonus) {
      return NextResponse.json({ error: "Bónus já coletado hoje" }, { status: 400 })
    }

    const daysSinceRegistration = Math.floor(
      (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    let bonusAmount = 0
    let bonusType = "none"
    let currency = "AOA"

    if (daysSinceRegistration === 0) {
      bonusAmount = 5
      bonusType = "welcome_day1"
    } else if (daysSinceRegistration === 1) {
      // Create free game vouchers
      await sql`
        INSERT INTO vouchers (user_id, code, type, uses, expires_at)
        VALUES 
          (${user.id}, ${`FREE_${user.id}_${Date.now()}_1`}, 'free_game', 1, ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}),
          (${user.id}, ${`FREE_${user.id}_${Date.now()}_2`}, 'free_game', 1, ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)})
      `
      return NextResponse.json({ success: true, message: "2 jogos grátis adicionados!" })
    } else if (daysSinceRegistration === 2) {
      bonusAmount = 5
      bonusType = "usd_bonus"
      currency = "USD"
    } else if (daysSinceRegistration === 3) {
      // Mixed bonus: 7 AOA + 1 USD
      const [aoaWallet] = await sql`SELECT id FROM wallets WHERE user_id = ${user.id} AND currency = 'AOA'`
      const [usdWallet] = await sql`SELECT id FROM wallets WHERE user_id = ${user.id} AND currency = 'USD'`

      await sql`
        INSERT INTO transactions (wallet_id, tx_type, amount, currency, status, meta)
        VALUES 
          (${aoaWallet.id}, 'daily_bonus', 7, 'AOA', 'completed', ${JSON.stringify({ bonus_day: 4, type: "mixed_aoa" })}),
          (${usdWallet.id}, 'daily_bonus', 1, 'USD', 'completed', ${JSON.stringify({ bonus_day: 4, type: "mixed_usd" })})
      `

      await sql`
        UPDATE wallets SET balance = balance + 7 WHERE id = ${aoaWallet.id}
      `
      await sql`
        UPDATE wallets SET balance = balance + 1 WHERE id = ${usdWallet.id}
      `

      return NextResponse.json({ success: true, message: "Bónus misto coletado: 7 AOA + 1 USD!" })
    } else {
      bonusAmount = 2
      bonusType = "daily_regular"
    }

    if (bonusAmount > 0) {
      const [wallet] = await sql`SELECT id FROM wallets WHERE user_id = ${user.id} AND currency = ${currency}`

      await sql`
        INSERT INTO transactions (wallet_id, tx_type, amount, currency, status, meta)
        VALUES (${wallet.id}, 'daily_bonus', ${bonusAmount}, ${currency}, 'completed', ${JSON.stringify({ bonus_day: daysSinceRegistration + 1, type: bonusType })})
      `

      if (currency === "AOA") {
        await sql`UPDATE wallets SET balance = balance + ${bonusAmount} WHERE id = ${wallet.id}`
      } else {
        await sql`UPDATE wallets SET non_transferable_balance = non_transferable_balance + ${bonusAmount} WHERE id = ${wallet.id}`
      }

      return NextResponse.json({
        success: true,
        message: `Bónus coletado: ${bonusAmount} ${currency}!`,
        amount: bonusAmount,
        currency,
      })
    }

    return NextResponse.json({ error: "Nenhum bónus disponível" }, { status: 400 })
  } catch (error) {
    console.error("Error claiming daily bonus:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
