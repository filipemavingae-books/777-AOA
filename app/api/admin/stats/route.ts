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
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Get platform statistics
    const [userStats] = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as new_users_24h,
        COUNT(CASE WHEN verified_email = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN kyc_level > 0 THEN 1 END) as kyc_users
      FROM users
    `

    const [gameStats] = await sql`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as games_24h,
        COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished_games,
        AVG(entry_fee) as avg_entry_fee
      FROM games
    `

    const [transactionStats] = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN tx_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN tx_type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END) as total_withdrawals,
        COUNT(CASE WHEN tx_type = 'withdrawal' AND status = 'pending_withdrawal' THEN 1 END) as pending_withdrawals
      FROM transactions
    `

    const [walletStats] = await sql`
      SELECT 
        SUM(balance) as total_balance,
        SUM(locked_balance) as total_locked,
        COUNT(*) as total_wallets
      FROM wallets
      WHERE currency = 'AOA'
    `

    return NextResponse.json({
      success: true,
      stats: {
        users: userStats,
        games: gameStats,
        transactions: transactionStats,
        wallets: walletStats,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
