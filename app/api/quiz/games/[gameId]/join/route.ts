import { type NextRequest, NextResponse } from "next/server"
import { joinGame } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
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

    const result = await joinGame(params.gameId, decoded.userId)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error("Join game error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
