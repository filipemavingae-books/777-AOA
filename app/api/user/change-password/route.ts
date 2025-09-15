import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth"
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

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Senhas são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Nova senha deve ter pelo menos 6 caracteres" },
        { status: 400 },
      )
    }

    // Get current password hash
    const [user] = await sql`
      SELECT password_hash FROM users WHERE id = ${decoded.userId}
    `

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "Senha atual incorreta" }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}
      WHERE id = ${decoded.userId}
    `

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
