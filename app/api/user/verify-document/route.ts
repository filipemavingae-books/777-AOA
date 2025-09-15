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
    const file = formData.get("document") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Simulate document verification with AI/ML analysis
    // In a real implementation, this would use actual document verification services
    const fileSize = file.size
    const fileName = file.name.toLowerCase()

    let score = 0
    let status = "rejected"
    let message = "Documento rejeitado"

    // Basic validation logic (simulate AI verification)
    if (fileSize > 100000 && fileSize < 5000000) {
      // Between 100KB and 5MB
      score += 30
    }

    if (fileName.includes("bi") || fileName.includes("id") || fileName.includes("passport")) {
      score += 20
    }

    if (fileName.endsWith(".jpg") || fileName.endsWith(".png") || fileName.endsWith(".pdf")) {
      score += 20
    }

    // Add random factor to simulate AI analysis
    const randomFactor = Math.floor(Math.random() * 30)
    score += randomFactor

    // Determine status and KYC level
    let kycLevel = 0
    if (score >= 80) {
      status = "verified"
      message = "Documento altamente confiável - Verificação aprovada"
      kycLevel = 2
    } else if (score >= 60) {
      status = "partial"
      message = "Documento parcialmente confiável - Verificação básica"
      kycLevel = 1
    } else {
      status = "rejected"
      message = "Documento não confiável - Verificação rejeitada"
      kycLevel = 0
    }

    // Update user KYC level
    await sql`
      UPDATE users 
      SET kyc_level = ${kycLevel}
      WHERE id = ${decoded.userId}
    `

    // Record verification attempt
    await sql`
      INSERT INTO document_verifications (user_id, file_name, score, status, created_at)
      VALUES (${decoded.userId}, ${fileName}, ${score}, ${status}, NOW())
    `

    return NextResponse.json({
      success: true,
      score: Math.min(score, 100),
      status,
      message,
      kycLevel,
    })
  } catch (error) {
    console.error("Erro ao verificar documento:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
