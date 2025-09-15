import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    const { username, fullName, email, iban } = await request.json()

    // Update user profile
    await sql`
      UPDATE users 
      SET username = ${username},
          full_name = ${fullName},
          email = ${email},
          iban = ${iban}
      WHERE id = ${decoded.userId}
    `

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
