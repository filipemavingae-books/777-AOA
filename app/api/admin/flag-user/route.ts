import { type NextRequest, NextResponse } from "next/server"
import { flagUser } from "@/lib/anti-fraud"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
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

    // Check if user is admin
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

    const { userId, reason } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
        },
        { status: 400 },
      )
    }

    await flagUser(userId, reason, decoded.userId)

    return NextResponse.json({
      success: true,
      message: "Usuário sinalizado com sucesso",
    })
  } catch (error) {
    console.error("Flag user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
