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

    const formData = await request.formData()
    const file = formData.get("photo") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhuma foto enviada" }, { status: 400 })
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const photoUrl = `data:${file.type};base64,${base64}`

    // Update user's profile photo
    await sql`
      UPDATE users 
      SET profile_photo = ${photoUrl}
      WHERE id = ${decoded.userId}
    `

    return NextResponse.json({
      success: true,
      message: "Foto de perfil atualizada com sucesso",
      photoUrl: photoUrl,
    })
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
