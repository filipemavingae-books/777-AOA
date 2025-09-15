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

    const withdrawals = await sql`
      SELECT 
        t.id,
        t.amount,
        t.currency,
        t.status,
        t.created_at,
        t.meta,
        u.username,
        u.email,
        u.kyc_level
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      WHERE t.tx_type = 'withdrawal'
      ORDER BY t.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ success: true, withdrawals })
  } catch (error) {
    console.error("Error fetching withdrawals:", error)
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
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { withdrawalId, action, reason } = await request.json()

    if (action === "approve") {
      await sql`
        UPDATE transactions 
        SET status = 'completed', meta = meta || ${JSON.stringify({ approved_by: user.id, approved_at: new Date(), reason })}
        WHERE id = ${withdrawalId} AND tx_type = 'withdrawal'
      `
    } else if (action === "reject") {
      await sql`
        UPDATE transactions 
        SET status = 'rejected', meta = meta || ${JSON.stringify({ rejected_by: user.id, rejected_at: new Date(), reason })}
        WHERE id = ${withdrawalId} AND tx_type = 'withdrawal'
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
