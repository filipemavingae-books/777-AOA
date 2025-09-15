import { sql } from "./database"

export interface FraudCheck {
  isValid: boolean
  riskLevel: "low" | "medium" | "high"
  flags: string[]
  shouldBlock: boolean
}

export async function performFraudCheck(
  userId: string,
  deviceFingerprint: string,
  ipAddress: string,
  action: string,
): Promise<FraudCheck> {
  const flags: string[] = []
  let riskLevel: "low" | "medium" | "high" = "low"

  try {
    let deviceCheck
    try {
      deviceCheck = await checkDeviceFingerprint(deviceFingerprint)
    } catch (error) {
      console.error("Device fingerprint check failed:", error)
      deviceCheck = { flagged: false, userCount: 0, lastFlagged: null }
    }

    if (deviceCheck.flagged || deviceCheck.userCount > 3) {
      flags.push("Dispositivo suspeito")
      riskLevel = "high"
    }

    let ipCheck
    try {
      ipCheck = await checkIPAddress(ipAddress, userId)
    } catch (error) {
      console.error("IP address check failed:", error)
      ipCheck = { multipleAccounts: 0, isVPN: false }
    }

    if (ipCheck.isVPN || ipCheck.multipleAccounts > 5) {
      flags.push("IP suspeito")
      riskLevel = riskLevel === "high" ? "high" : "medium"
    }

    if (userId) {
      try {
        const behaviorCheck = await checkUserBehavior(userId, action)
        if (behaviorCheck.suspicious) {
          flags.push("Comportamento suspeito")
          riskLevel = "high"
        }
      } catch (error) {
        console.error("User behavior check failed:", error)
      }
    }

    try {
      const rapidCreationCheck = await checkRapidAccountCreation(ipAddress, deviceFingerprint)
      if (rapidCreationCheck.tooMany) {
        flags.push("Muitas contas criadas recentemente")
        riskLevel = "high"
      }
    } catch (error) {
      console.error("Rapid account creation check failed:", error)
    }

    const shouldBlock = riskLevel === "high" && flags.length >= 2

    return {
      isValid: !shouldBlock,
      riskLevel,
      flags,
      shouldBlock,
    }
  } catch (error) {
    console.error("Fraud check failed:", error)
    // Return safe defaults if fraud check fails completely
    return {
      isValid: true,
      riskLevel: "low",
      flags: [],
      shouldBlock: false,
    }
  }
}

async function checkDeviceFingerprint(fingerprint: string) {
  if (!fingerprint || fingerprint.trim() === "") {
    return { flagged: false, userCount: 0, lastFlagged: null }
  }

  const [device] = await sql`
    SELECT device_fingerprint, user_count, flagged, last_flagged_at
    FROM device_flags
    WHERE device_fingerprint = ${fingerprint}
  `

  return {
    flagged: device?.flagged || false,
    userCount: device?.user_count || 0,
    lastFlagged: device?.last_flagged_at,
  }
}

async function checkIPAddress(ipAddress: string, userId: string) {
  if (!ipAddress || ipAddress === "unknown") {
    return { multipleAccounts: 0, isVPN: false }
  }

  // Check how many different users have used this IP
  const ipUsers = await sql`
    SELECT COUNT(DISTINCT user_id) as user_count
    FROM ip_logs
    WHERE ip_address = ${ipAddress}
    AND created_at > NOW() - INTERVAL '24 hours'
  `

  // Check if IP is from known VPN/proxy ranges (simplified check)
  const isVPN = await checkVPNIP(ipAddress)

  if (userId && userId.trim() !== "") {
    try {
      await sql`
        INSERT INTO ip_logs (user_id, ip_address, action)
        VALUES (${userId}, ${ipAddress}, 'fraud_check')
      `
    } catch (error) {
      console.error("Failed to log IP:", error)
    }
  }

  return {
    multipleAccounts: ipUsers[0]?.user_count || 0,
    isVPN,
  }
}

async function checkVPNIP(ipAddress: string): Promise<boolean> {
  // In production, you would use a VPN detection service
  // For now, we'll do a simple check for common VPN IP ranges
  const vpnRanges = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    // Add more VPN/proxy IP ranges
  ]

  // Simplified check - in production use proper IP range checking
  return false
}

async function checkUserBehavior(userId: string, action: string) {
  if (!userId || userId.trim() === "") {
    return { suspicious: false }
  }

  // Check for suspicious patterns
  const recentActions = await sql`
    SELECT action, created_at
    FROM ip_logs
    WHERE user_id = ${userId}
    AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 50
  `

  let suspicious = false

  // Check for too many rapid actions
  if (recentActions.length > 30) {
    suspicious = true
  }

  // Check for unusual patterns (e.g., too many failed login attempts)
  const failedLogins = recentActions.filter((a) => a.action === "failed_login").length
  if (failedLogins > 5) {
    suspicious = true
  }

  return { suspicious }
}

async function checkRapidAccountCreation(ipAddress: string, deviceFingerprint: string) {
  if (!ipAddress || ipAddress === "unknown") {
    return { tooMany: false }
  }

  try {
    // Check accounts created from same IP in last 24 hours
    const ipAccounts = await sql`
      SELECT COUNT(*) as count
      FROM users u
      JOIN ip_logs il ON u.id = il.user_id
      WHERE il.ip_address = ${ipAddress}
      AND il.action = 'register'
      AND u.created_at > NOW() - INTERVAL '24 hours'
    `

    let deviceAccountCount = 0
    // Check accounts created from same device in last 24 hours (only if fingerprint exists)
    if (deviceFingerprint && deviceFingerprint.trim() !== "") {
      const deviceAccounts = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE device_fingerprint = ${deviceFingerprint}
        AND created_at > NOW() - INTERVAL '24 hours'
      `
      deviceAccountCount = deviceAccounts[0]?.count || 0
    }

    return {
      tooMany: (ipAccounts[0]?.count || 0) > 3 || deviceAccountCount > 2,
    }
  } catch (error) {
    console.error("Rapid account creation check failed:", error)
    return { tooMany: false }
  }
}

export async function flagUser(userId: string, reason: string, adminId?: string) {
  await sql`
    INSERT INTO audit_logs (user_id, admin_id, action, details)
    VALUES (${userId}, ${adminId || null}, 'user_flagged', ${JSON.stringify({ reason })})
  `

  // Disable user account
  await sql`
    UPDATE users
    SET is_active = false
    WHERE id = ${userId}
  `
}

export async function flagDevice(deviceFingerprint: string, reason: string) {
  await sql`
    UPDATE device_flags
    SET flagged = true, last_flagged_at = NOW()
    WHERE device_fingerprint = ${deviceFingerprint}
  `

  await sql`
    INSERT INTO audit_logs (action, details)
    VALUES ('device_flagged', ${JSON.stringify({ device_fingerprint: deviceFingerprint, reason })})
  `
}

export async function getSuspiciousUsers(limit = 50) {
  const users = await sql`
    SELECT 
      u.id,
      u.username,
      u.email,
      u.created_at,
      u.is_active,
      df.user_count as device_user_count,
      df.flagged as device_flagged,
      (SELECT COUNT(*) FROM ip_logs WHERE user_id = u.id AND created_at > NOW() - INTERVAL '24 hours') as recent_activity
    FROM users u
    LEFT JOIN device_flags df ON u.device_fingerprint = df.device_fingerprint
    WHERE df.flagged = true 
       OR df.user_count > 3
       OR u.is_active = false
    ORDER BY u.created_at DESC
    LIMIT ${limit}
  `

  return users
}

export async function getSuspiciousTransfers(limit = 50) {
  const transfers = await sql`
    SELECT 
      t.*,
      from_user.username as from_username,
      to_user.username as to_username,
      from_user.device_fingerprint as from_device,
      to_user.device_fingerprint as to_device
    FROM transfers t
    JOIN users from_user ON t.from_user = from_user.id
    JOIN users to_user ON t.to_user = to_user.id
    WHERE t.status = 'flagged'
       OR from_user.device_fingerprint = to_user.device_fingerprint
       OR t.amount > 500
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `

  return transfers
}

export async function checkTransferSuspicion(fromUserId: string, toUserId: string, amount: number) {
  try {
    // Check if users share same device
    const deviceCheck = await sql`
      SELECT 
        from_user.device_fingerprint as from_device,
        to_user.device_fingerprint as to_device
      FROM users from_user, users to_user
      WHERE from_user.id = ${fromUserId} AND to_user.id = ${toUserId}
    `

    if (
      deviceCheck[0]?.from_device &&
      deviceCheck[0]?.to_device &&
      deviceCheck[0]?.from_device === deviceCheck[0]?.to_device
    ) {
      return { suspicious: true, reason: "Same device fingerprint" }
    }

    // Check for circular transfers
    const recentTransfers = await sql`
      SELECT COUNT(*) as count
      FROM transfers
      WHERE ((from_user = ${fromUserId} AND to_user = ${toUserId})
         OR (from_user = ${toUserId} AND to_user = ${fromUserId}))
      AND created_at > NOW() - INTERVAL '1 hour'
    `

    if ((recentTransfers[0]?.count || 0) > 3) {
      return { suspicious: true, reason: "Too many transfers between users" }
    }

    // Check for large amounts
    if (amount > 1000) {
      return { suspicious: true, reason: "Large transfer amount" }
    }

    return { suspicious: false }
  } catch (error) {
    console.error("Transfer suspicion check failed:", error)
    return { suspicious: false }
  }
}
