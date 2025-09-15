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

    const games = await sql`
      SELECT 
        g.id,
        g.entry_fee,
        g.currency,
        g.status,
        g.created_at,
        g.finished_at,
        u.username as host_username,
        COUNT(gp.id) as player_count,
        SUM(CASE WHEN gp.placed = true THEN g.entry_fee ELSE 0 END) as total_pot
      FROM games g
      LEFT JOIN users u ON g.host_id = u.id
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, u.username
      ORDER BY g.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ success: true, games })
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
