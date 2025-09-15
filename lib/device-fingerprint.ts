"use client"

// Generate device fingerprint for fraud prevention
export function generateDeviceFingerprint(): string {
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    let canvasFingerprint = "canvas-unavailable"
    if (ctx) {
      try {
        ctx.fillText("Device fingerprint", 10, 10)
        canvasFingerprint = canvas.toDataURL()
      } catch (canvasError) {
        console.warn("Canvas fingerprinting failed:", canvasError)
        canvasFingerprint = "canvas-blocked"
      }
    }

    const fingerprint = {
      userAgent: navigator.userAgent || "unknown",
      language: navigator.language || "unknown",
      platform: navigator.platform || "unknown",
      screen: `${screen.width || 0}x${screen.height || 0}`,
      timezone: (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown"
        } catch {
          return "unknown"
        }
      })(),
      canvas: canvasFingerprint.slice(-50), // Last 50 chars
      memory: (navigator as any).deviceMemory || "unknown",
      cores: navigator.hardwareConcurrency || "unknown",
      colorDepth: screen.colorDepth || "unknown",
      pixelDepth: screen.pixelDepth || "unknown",
      cookieEnabled: navigator.cookieEnabled || false,
      doNotTrack: navigator.doNotTrack || "unknown",
    }

    // Create hash from fingerprint data
    const fingerprintString = JSON.stringify(fingerprint)
    let hash = 0
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    const result = Math.abs(hash).toString(36)

    const timestamp = Date.now().toString(36).slice(-4)
    return result.length < 8 ? `${result}${timestamp}` : result
  } catch (error) {
    console.error("Device fingerprint generation failed:", error)
    const fallback = `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    return fallback
  }
}
