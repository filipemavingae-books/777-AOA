import { type NextRequest, NextResponse } from "next/server"
import { createUser, checkDeviceFingerprint, incrementDeviceUserCount, sql } from "@/lib/database"
import { hashPassword, validateRegistrationData, generateToken } from "@/lib/auth"
import { performFraudCheck } from "@/lib/anti-fraud"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    console.log("[v0] Registration attempt:", { username: data.username, email: data.email })

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
        },
        { status: 400 },
      )
    }

    // Validate input data
    const { isValid, errors } = validateRegistrationData(data)
    if (!isValid) {
      console.log("[v0] Validation errors:", errors)
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    let fraudCheck
    try {
      fraudCheck = await performFraudCheck("", data.deviceFingerprint || "", clientIP, "register")
    } catch (fraudError) {
      console.error("[v0] Fraud check error:", fraudError)
      // Continue with registration if fraud check fails
      fraudCheck = { shouldBlock: false }
    }

    if (fraudCheck.shouldBlock) {
      return NextResponse.json(
        {
          success: false,
          error: "Registro bloqueado devido a atividade suspeita. Entre em contato com o suporte.",
        },
        { status: 403 },
      )
    }

    let deviceCheck
    try {
      deviceCheck = await checkDeviceFingerprint(data.deviceFingerprint || "")
    } catch (deviceError) {
      console.error("[v0] Device check error:", deviceError)
      deviceCheck = { isNew: true, flagged: false, userCount: 1 }
    }

    if (deviceCheck.flagged || deviceCheck.userCount > 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Este dispositivo foi sinalizado por atividade suspeita",
        },
        { status: 403 },
      )
    }

    let referralData = null
    if (data.inviteCode && data.inviteCode.trim()) {
      try {
        const [referral] = await sql`
          SELECT r.id, r.inviter_id, u.username as inviter_username
          FROM referrals r
          JOIN users u ON r.inviter_id = u.id
          WHERE r.invite_uuid = ${data.inviteCode.trim()}
          AND r.invitee_id IS NULL
          LIMIT 1
        `

        if (referral) {
          referralData = referral
        }
      } catch (referralError) {
        console.error("[v0] Referral check error:", referralError)
        // Continue without referral if check fails
      }
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    try {
      // Create user
      const user = await createUser({
        username: data.username,
        email: data.email,
        phone: data.phone,
        password_hash: passwordHash,
        full_name: data.fullName,
        birth_date: data.birthDate,
        iban: data.iban,
        identity_document: data.identityDocument,
        device_fingerprint: data.deviceFingerprint || "",
      })

      console.log("[v0] User created successfully:", user.id)

      if (referralData) {
        try {
          await sql`
            UPDATE referrals 
            SET invitee_id = ${user.id}
            WHERE id = ${referralData.id}
          `
          console.log("[v0] Referral updated successfully")
        } catch (referralUpdateError) {
          console.error("[v0] Referral update error:", referralUpdateError)
          // Continue even if referral update fails
        }
      }

      // Update device count
      if (!deviceCheck.isNew) {
        try {
          await incrementDeviceUserCount(data.deviceFingerprint || "")
        } catch (deviceUpdateError) {
          console.error("[v0] Device count update error:", deviceUpdateError)
          // Continue even if device update fails
        }
      }

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
        },
      })

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      return response
    } catch (dbError: any) {
      console.error("[v0] Database error:", dbError)

      if (dbError.message?.includes("duplicate key") || dbError.code === "23505") {
        const errorMessage = dbError.message || dbError.detail || ""

        if (errorMessage.includes("username") || errorMessage.includes("users_username_key")) {
          return NextResponse.json(
            {
              success: false,
              errors: { username: "Nome de usuário já existe" },
            },
            { status: 400 },
          )
        }
        if (errorMessage.includes("email") || errorMessage.includes("users_email_key")) {
          return NextResponse.json(
            {
              success: false,
              errors: { email: "Email já está em uso" },
            },
            { status: 400 },
          )
        }
        if (errorMessage.includes("phone") || errorMessage.includes("users_phone_key")) {
          return NextResponse.json(
            {
              success: false,
              errors: { phone: "Telefone já está em uso" },
            },
            { status: 400 },
          )
        }

        // Generic duplicate key error
        return NextResponse.json(
          {
            success: false,
            error: "Dados já existem no sistema",
          },
          { status: 400 },
        )
      }

      if (dbError.message?.includes("age_check") || dbError.code === "23514") {
        return NextResponse.json(
          {
            success: false,
            errors: { birthDate: "Você deve ter pelo menos 18 anos para se registrar" },
          },
          { status: 400 },
        )
      }

      throw dbError
    }
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
