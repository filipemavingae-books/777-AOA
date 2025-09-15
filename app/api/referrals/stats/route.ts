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

    // Get referral statistics
    const [stats] = await sql`
      SELECT 
        COUNT(CASE WHEN activated = true THEN 1 END) as active_referrals,
        COUNT(*) as total_referrals,
        SUM(CASE WHEN activated = true THEN bonus_amount ELSE 0 END) as total_earned
      FROM referrals 
      WHERE inviter_id = ${user.id}
    `

    // Get recent referrals
    const recentReferrals = await sql`
      SELECT 
        r.created_at,
        r.activated,
        r.bonus_amount,
        u.username as invitee_username
      FROM referrals r
      LEFT JOIN users u ON r.invitee_id = u.id
      WHERE r.inviter_id = ${user.id}
      ORDER BY r.created_at DESC
      LIMIT 10
    `

    // Check weekly earnings limit
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const [weeklyEarnings] = await sql`
      SELECT COALESCE(SUM(bonus_amount), 0) as weekly_total
      FROM referrals 
      WHERE inviter_id = ${user.id} 
      AND activated = true 
      AND created_at >= ${weekStart}
    `

    return NextResponse.json({
      success: true,
      stats: {
        activeReferrals: stats.active_referrals || 0,
        totalReferrals: stats.total_referrals || 0,
        totalEarned: stats.total_earned || 0,
        weeklyEarned: weeklyEarnings.weekly_total || 0,
        weeklyLimit: 50,
      },
      recentReferrals,
    })
  } catch (error) {
    console.error("Error fetching referral stats:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
