import { type NextRequest, NextResponse } from "next/server"
import { getSuspiciousUsers } from "@/lib/anti-fraud"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Token não encontrado",
        },
        { status: 401 },
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: "Token inválido",
        },
        { status: 401 },
      )
    }

    // Check if user is admin (in production, you'd have proper role checking)
    const [user] = await sql`
      SELECT kyc_level FROM users WHERE id = ${decoded.userId}
    `

    if (!user || user.kyc_level < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso negado",
        },
        { status: 403 },
      )
    }

    const suspiciousUsers = await getSuspiciousUsers()

    return NextResponse.json({
      success: true,
      users: suspiciousUsers,
    })
  } catch (error) {
    console.error("Get suspicious users error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
