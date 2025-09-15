import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateLastLogin } from "@/lib/database"
import { verifyPassword, generateToken } from "@/lib/auth"
import { performFraudCheck } from "@/lib/anti-fraud"

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceFingerprint } = await request.json()
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email e senha são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciais inválidas",
        },
        { status: 401 },
      )
    }

    if (deviceFingerprint) {
      const fraudCheck = await performFraudCheck(user.id, deviceFingerprint, clientIP, "login")

      if (fraudCheck.shouldBlock) {
        return NextResponse.json(
          {
            success: false,
            error: "Login bloqueado devido a atividade suspeita. Entre em contato com o suporte.",
          },
          { status: 403 },
        )
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciais inválidas",
        },
        { status: 401 },
      )
    }

    // Update last login and log IP
    await updateLastLogin(user.id, clientIP)

    // Generate JWT token
    const token = generateToken(user.id)

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        walletNumber: user.wallet_number,
        qrCodeData: user.qr_code_data,
        verified: user.verified_email && user.verified_phone,
        kycLevel: user.kyc_level,
      },
    })

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
