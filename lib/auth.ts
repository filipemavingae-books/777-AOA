import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function validateRegistrationData(data: any) {
  const errors: Record<string, string> = {}

  // Check if data exists
  if (!data || typeof data !== "object") {
    errors.general = "Dados inválidos"
    return { isValid: false, errors }
  }

  // Username validation
  if (!data.username || typeof data.username !== "string") {
    errors.username = "Nome de usuário é obrigatório"
  } else if (data.username.length < 3) {
    errors.username = "Nome de usuário deve ter pelo menos 3 caracteres"
  } else if (data.username.length > 50) {
    errors.username = "Nome de usuário deve ter no máximo 50 caracteres"
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = "Nome de usuário deve conter apenas letras, números e underscore"
  }

  // Email validation
  if (!data.email || typeof data.email !== "string") {
    errors.email = "Email é obrigatório"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email inválido"
  } else if (data.email.length > 255) {
    errors.email = "Email muito longo"
  }

  // Phone validation
  if (!data.phone || typeof data.phone !== "string") {
    errors.phone = "Telefone é obrigatório"
  } else {
    const cleanPhone = data.phone.replace(/\s/g, "")
    if (!/^(\+244|244)?[0-9]{9}$/.test(cleanPhone)) {
      errors.phone = "Telefone deve ser um número angolano válido"
    }
  }

  // Password validation
  if (!data.password || typeof data.password !== "string") {
    errors.password = "Senha é obrigatória"
  } else if (data.password.length < 6) {
    errors.password = "Senha deve ter pelo menos 6 caracteres"
  } else if (data.password.length > 128) {
    errors.password = "Senha muito longa"
  }

  // Full name validation
  if (!data.fullName || typeof data.fullName !== "string") {
    errors.fullName = "Nome completo é obrigatório"
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = "Nome completo deve ter pelo menos 2 caracteres"
  } else if (data.fullName.length > 255) {
    errors.fullName = "Nome completo muito longo"
  }

  // Birth date validation
  if (!data.birthDate || typeof data.birthDate !== "string") {
    errors.birthDate = "Data de nascimento é obrigatória"
  } else {
    try {
      const age = calculateAge(data.birthDate)
      if (age < 18) {
        errors.birthDate = "Você deve ter pelo menos 18 anos"
      } else if (age > 120) {
        errors.birthDate = "Data de nascimento inválida"
      }
    } catch (dateError) {
      errors.birthDate = "Data de nascimento inválida"
    }
  }

  // Device fingerprint validation (optional but recommended)
  if (data.deviceFingerprint && typeof data.deviceFingerprint !== "string") {
    errors.deviceFingerprint = "Fingerprint do dispositivo inválido"
  }

  // IBAN validation (optional)
  if (data.iban && typeof data.iban === "string" && data.iban.trim()) {
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(data.iban.replace(/\s/g, ""))) {
      errors.iban = "IBAN inválido"
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}
