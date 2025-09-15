import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
  try {
    const { uuid } = params

    // Validate referral UUID
    const [referral] = await sql`
      SELECT 
        r.invite_uuid,
        r.inviter_id,
        u.username as inviter_username
      FROM referrals r
      JOIN users u ON r.inviter_id = u.id
      WHERE r.invite_uuid = ${uuid}
      AND r.invitee_id IS NULL
      LIMIT 1
    `

    if (!referral) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      inviteUuid: referral.invite_uuid,
      inviterUsername: referral.inviter_username,
    })
  } catch (error) {
    console.error("Error validating referral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
