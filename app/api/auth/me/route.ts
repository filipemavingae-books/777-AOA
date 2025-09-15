import { type NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

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

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        walletNumber: user.wallet_number,
        qrCodeData: user.qr_code_data,
        verified: user.verified_email && user.verified_phone,
        kycLevel: user.kyc_level,
        createdAt: user.created_at,
        profilePhoto: user.profile_photo,
        iban: user.iban,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
