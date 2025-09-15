import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"

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

    // Check if user already has an active referral code
    const [existingReferral] = await sql`
      SELECT invite_uuid FROM referrals 
      WHERE inviter_id = ${user.id} 
      AND invite_uuid IS NOT NULL
      LIMIT 1
    `

    if (existingReferral) {
      return NextResponse.json({
        success: true,
        inviteCode: existingReferral.invite_uuid,
        inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/invite/${existingReferral.invite_uuid}`,
      })
    }

    // Create new referral code
    const inviteUuid = uuidv4()

    await sql`
      INSERT INTO referrals (inviter_id, invite_uuid, created_at)
      VALUES (${user.id}, ${inviteUuid}, NOW())
    `

    return NextResponse.json({
      success: true,
      inviteCode: inviteUuid,
      inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/invite/${inviteUuid}`,
    })
  } catch (error) {
    console.error("Error creating referral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
