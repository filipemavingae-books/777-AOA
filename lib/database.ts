import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Database helper functions
export async function createUser(userData: {
  username: string
  email: string
  phone: string
  password_hash: string
  full_name: string
  birth_date: string
  iban?: string
  identity_document?: string
  device_fingerprint: string
}) {
  try {
    // Generate unique wallet number
    const walletNumber = Math.random().toString(36).substring(2, 15).toUpperCase()
    const qrCodeData = `quizmaster:${walletNumber}`

    // Create user with transaction
    const [user] = await sql`
      INSERT INTO users (
        username, email, phone, password_hash, full_name, birth_date,
        iban, identity_document, device_fingerprint, wallet_number, qr_code_data
      ) VALUES (
        ${userData.username}, ${userData.email}, ${userData.phone}, ${userData.password_hash},
        ${userData.full_name}, ${userData.birth_date}, ${userData.iban || null},
        ${userData.identity_document || null}, ${userData.device_fingerprint},
        ${walletNumber}, ${qrCodeData}
      )
      RETURNING id, username, email, wallet_number, qr_code_data
    `

    // Create wallets for AOA and USD
    await sql`
      INSERT INTO wallets (user_id, currency, balance)
      VALUES 
        (${user.id}, 'AOA', 0),
        (${user.id}, 'USD', 0)
    `

    // Schedule welcome bonuses with proper date handling
    const now = new Date()
    const day1Expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const day2Expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const day3Expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const day4Expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await sql`
      INSERT INTO daily_bonuses (user_id, day_number, bonus_type, amount, currency, expires_at)
      VALUES 
        (${user.id}, 1, 'aoa_bonus', 5, 'AOA', ${day1Expires.toISOString()}),
        (${user.id}, 2, 'free_games', 2, 'AOA', ${day2Expires.toISOString()}),
        (${user.id}, 3, 'usd_bonus', 5, 'USD', ${day3Expires.toISOString()}),
        (${user.id}, 4, 'mixed_bonus', 7, 'AOA', ${day4Expires.toISOString()})
    `

    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  const [user] = await sql`
    SELECT id, username, email, password_hash, verified_email, verified_phone, 
           kyc_level, wallet_number, qr_code_data, is_active
    FROM users 
    WHERE email = ${email} AND is_active = true
  `
  return user
}

export async function getUserById(id: string) {
  const [user] = await sql`
    SELECT id, username, email, full_name, phone, verified_email, verified_phone,
           kyc_level, wallet_number, qr_code_data, created_at
    FROM users 
    WHERE id = ${id} AND is_active = true
  `
  return user
}

export async function updateLastLogin(userId: string, ipAddress: string) {
  await sql`
    UPDATE users 
    SET last_login_at = NOW() 
    WHERE id = ${userId}
  `

  // Log IP for fraud detection
  await sql`
    INSERT INTO ip_logs (user_id, ip_address, action)
    VALUES (${userId}, ${ipAddress}, 'login')
  `
}

export async function checkDeviceFingerprint(fingerprint: string) {
  const [device] = await sql`
    SELECT device_fingerprint, user_count, flagged
    FROM device_flags
    WHERE device_fingerprint = ${fingerprint}
  `

  if (!device) {
    // First time seeing this device
    await sql`
      INSERT INTO device_flags (device_fingerprint, user_count)
      VALUES (${fingerprint}, 1)
    `
    return { isNew: true, flagged: false, userCount: 1 }
  }

  return { isNew: false, flagged: device.flagged, userCount: device.user_count }
}

export async function incrementDeviceUserCount(fingerprint: string) {
  await sql`
    UPDATE device_flags 
    SET user_count = user_count + 1,
        last_flagged_at = CASE WHEN user_count >= 2 THEN NOW() ELSE last_flagged_at END,
        flagged = CASE WHEN user_count >= 2 THEN true ELSE flagged END
    WHERE device_fingerprint = ${fingerprint}
  `
}

export async function getUserWallets(userId: string) {
  const wallets = await sql`
    SELECT currency, balance, locked_balance, non_transferable_balance
    FROM wallets 
    WHERE user_id = ${userId}
  `
  return wallets
}

export async function getUserByWalletNumber(walletNumber: string) {
  const [user] = await sql`
    SELECT id, username, wallet_number, qr_code_data
    FROM users 
    WHERE wallet_number = ${walletNumber} AND is_active = true
  `
  return user
}

export async function getUserByUsername(username: string) {
  const [user] = await sql`
    SELECT id, username, wallet_number, qr_code_data
    FROM users 
    WHERE username = ${username} AND is_active = true
  `
  return user
}

export async function createTransfer(transferData: {
  fromUserId: string
  toUserId: string
  amount: number
  fee: number
  currency: string
  message?: string
}) {
  const { fromUserId, toUserId, amount, fee, currency, message } = transferData

  // Perform fraud check before transfer
  const suspicionCheck = await import("./anti-fraud").then((module) =>
    module.checkTransferSuspicion(fromUserId, toUserId, amount),
  )

  // Start transaction
  await sql`BEGIN`

  try {
    // Get wallets with row locks
    const [fromWallet] = await sql`
      SELECT id, balance, locked_balance, non_transferable_balance
      FROM wallets 
      WHERE user_id = ${fromUserId} AND currency = ${currency}
      FOR UPDATE
    `

    const [toWallet] = await sql`
      SELECT id, balance
      FROM wallets 
      WHERE user_id = ${toUserId} AND currency = ${currency}
      FOR UPDATE
    `

    if (!fromWallet || !toWallet) {
      throw new Error("Carteira não encontrada")
    }

    const availableBalance = fromWallet.balance - fromWallet.locked_balance - fromWallet.non_transferable_balance
    const totalAmount = amount + fee

    if (availableBalance < totalAmount) {
      throw new Error("Saldo insuficiente")
    }

    // Create transfer record with potential flag
    const transferStatus = suspicionCheck.suspicious ? "flagged" : "completed"
    const [transfer] = await sql`
      INSERT INTO transfers (from_user, to_user, amount, fee, currency, message, status, meta)
      VALUES (${fromUserId}, ${toUserId}, ${amount}, ${fee}, ${currency}, ${message || null}, ${transferStatus}, ${JSON.stringify({ suspicion_reason: suspicionCheck.reason })})
      RETURNING id, created_at
    `

    if (transferStatus === "completed") {
      // Update balances only if not flagged
      await sql`
        UPDATE wallets 
        SET balance = balance - ${totalAmount}
        WHERE id = ${fromWallet.id}
      `

      await sql`
        UPDATE wallets 
        SET balance = balance + ${amount}
        WHERE id = ${toWallet.id}
      `

      // Create transaction records
      await sql`
        INSERT INTO transactions (wallet_id, tx_type, amount, currency, status, meta)
        VALUES 
          (${fromWallet.id}, 'transfer_out', ${totalAmount}, ${currency}, 'completed', ${JSON.stringify({ transfer_id: transfer.id, to_user: toUserId })}),
          (${toWallet.id}, 'transfer_in', ${amount}, ${currency}, 'completed', ${JSON.stringify({ transfer_id: transfer.id, from_user: fromUserId })})
      `
    } else {
      // Log flagged transfer for admin review
      await sql`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (${fromUserId}, 'transfer_flagged', ${JSON.stringify({ transfer_id: transfer.id, reason: suspicionCheck.reason, amount, to_user: toUserId })})
      `
    }

    await sql`COMMIT`

    if (transferStatus === "flagged") {
      throw new Error("Transferência sinalizada para revisão devido a atividade suspeita")
    }

    return transfer
  } catch (error) {
    await sql`ROLLBACK`
    throw error
  }
}

export async function getTransferHistory(userId: string, limit = 50) {
  const transfers = await sql`
    SELECT 
      t.id,
      t.amount,
      t.fee,
      t.currency,
      t.message,
      t.status,
      t.created_at,
      CASE 
        WHEN t.from_user = ${userId} THEN 'sent'
        ELSE 'received'
      END as type,
      CASE 
        WHEN t.from_user = ${userId} THEN to_user.username
        ELSE from_user.username
      END as other_username,
      CASE 
        WHEN t.from_user = ${userId} THEN to_user.wallet_number
        ELSE from_user.wallet_number
      END as other_wallet_number
    FROM transfers t
    JOIN users from_user ON t.from_user = from_user.id
    JOIN users to_user ON t.to_user = to_user.id
    WHERE t.from_user = ${userId} OR t.to_user = ${userId}
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `
  return transfers
}

export async function getTransactionHistory(userId: string, limit = 50) {
  const transactions = await sql`
    SELECT 
      tr.id,
      tr.tx_type,
      tr.amount,
      tr.currency,
      tr.status,
      tr.meta,
      tr.created_at
    FROM transactions tr
    JOIN wallets w ON tr.wallet_id = w.id
    WHERE w.user_id = ${userId}
    ORDER BY tr.created_at DESC
    LIMIT ${limit}
  `
  return transactions
}

export async function checkDailyTransferLimit(userId: string, currency = "AOA") {
  const today = new Date().toISOString().split("T")[0]

  const [result] = await sql`
    SELECT COALESCE(SUM(amount + fee), 0) as daily_total
    FROM transfers
    WHERE from_user = ${userId} 
      AND currency = ${currency}
      AND DATE(created_at) = ${today}
      AND status = 'completed'
  `

  return result.daily_total || 0
}

export async function getRandomQuestions(count = 10, difficulty?: number, category?: string) {
  try {
    let baseQuery = `
      SELECT id, question, options, correct_answer, difficulty, category
      FROM quiz_questions 
      WHERE is_active = true
    `

    const conditions = []
    const params = []

    if (difficulty) {
      conditions.push(`difficulty = $${params.length + 1}`)
      params.push(difficulty)
    }

    if (category) {
      conditions.push(`category = $${params.length + 1}`)
      params.push(category)
    }

    if (conditions.length > 0) {
      baseQuery += ` AND ${conditions.join(" AND ")}`
    }

    baseQuery += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`
    params.push(count)

    // Use template literal for dynamic query
    if (params.length === 1) {
      return await sql`
        SELECT id, question, options, correct_answer, difficulty, category
        FROM quiz_questions 
        WHERE is_active = true
        ORDER BY RANDOM() 
        LIMIT ${count}
      `
    } else {
      // For complex queries with multiple parameters, use raw SQL
      const result = await sql.unsafe(baseQuery, params)
      return result
    }
  } catch (error) {
    console.error("Error getting random questions:", error)
    throw error
  }
}

export async function createGame(hostId: string, entryFee = 50) {
  const [game] = await sql`
    INSERT INTO games (host_id, entry_fee, status)
    VALUES (${hostId}, ${entryFee}, 'pending')
    RETURNING id, created_at
  `
  return game
}

export async function joinGame(gameId: string, userId: string) {
  await sql`BEGIN`

  try {
    // Check if game exists and is joinable
    const [game] = await sql`
      SELECT id, status, entry_fee, max_players,
             (SELECT COUNT(*) FROM game_players WHERE game_id = ${gameId}) as current_players
      FROM games 
      WHERE id = ${gameId} AND status = 'pending'
    `

    if (!game) {
      throw new Error("Jogo não encontrado ou já iniciado")
    }

    if (game.current_players >= game.max_players) {
      throw new Error("Jogo lotado")
    }

    // Check if user already joined
    const [existingPlayer] = await sql`
      SELECT id FROM game_players 
      WHERE game_id = ${gameId} AND user_id = ${userId}
    `

    if (existingPlayer) {
      throw new Error("Você já está neste jogo")
    }

    // Get user's AOA wallet
    const [wallet] = await sql`
      SELECT id, balance, locked_balance, non_transferable_balance
      FROM wallets 
      WHERE user_id = ${userId} AND currency = 'AOA'
      FOR UPDATE
    `

    if (!wallet) {
      throw new Error("Carteira não encontrada")
    }

    const availableBalance = wallet.balance - wallet.locked_balance - wallet.non_transferable_balance

    if (availableBalance < game.entry_fee) {
      throw new Error("Saldo insuficiente")
    }

    // Create entry transaction
    const [transaction] = await sql`
      INSERT INTO transactions (wallet_id, tx_type, amount, currency, status, meta)
      VALUES (${wallet.id}, 'entry_fee', ${game.entry_fee}, 'AOA', 'completed', ${JSON.stringify({ game_id: gameId })})
      RETURNING id
    `

    // Lock the entry fee
    await sql`
      UPDATE wallets 
      SET locked_balance = locked_balance + ${game.entry_fee}
      WHERE id = ${wallet.id}
    `

    // Add player to game
    await sql`
      INSERT INTO game_players (game_id, user_id, entry_transaction_id)
      VALUES (${gameId}, ${userId}, ${transaction.id})
    `

    // Update prize pool
    await sql`
      UPDATE games 
      SET prize_pool = prize_pool + ${game.entry_fee}
      WHERE id = ${gameId}
    `

    await sql`COMMIT`
    return { success: true, gameId, entryFee: game.entry_fee }
  } catch (error) {
    await sql`ROLLBACK`
    throw error
  }
}

export async function startGame(gameId: string) {
  const [game] = await sql`
    UPDATE games 
    SET status = 'running', started_at = NOW()
    WHERE id = ${gameId} AND status = 'pending'
    RETURNING id, started_at
  `

  if (!game) {
    throw new Error("Não foi possível iniciar o jogo")
  }

  return game
}

export async function submitAnswer(
  gameId: string,
  userId: string,
  questionId: string,
  answer: number,
  timeSpent: number,
) {
  // Get correct answer
  const [question] = await sql`
    SELECT correct_answer, difficulty FROM quiz_questions WHERE id = ${questionId}
  `

  if (!question) {
    throw new Error("Pergunta não encontrada")
  }

  const isCorrect = question.correct_answer === answer

  // Calculate score based on correctness, difficulty, and time
  let score = 0
  if (isCorrect) {
    const baseScore = question.difficulty * 100
    const timeBonus = Math.max(0, 30 - timeSpent) * 10 // Bonus for quick answers
    score = baseScore + timeBonus
  }

  // Update player score
  await sql`
    UPDATE game_players 
    SET score = score + ${score}
    WHERE game_id = ${gameId} AND user_id = ${userId}
  `

  return { isCorrect, score, totalScore: score }
}

export async function finishGame(gameId: string) {
  await sql`BEGIN`

  try {
    // Get game and players
    const [game] = await sql`
      SELECT id, prize_pool, entry_fee FROM games WHERE id = ${gameId}
    `

    const players = await sql`
      SELECT gp.user_id, gp.score, gp.entry_transaction_id, u.username,
             ROW_NUMBER() OVER (ORDER BY gp.score DESC) as position
      FROM game_players gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = ${gameId}
      ORDER BY gp.score DESC
    `

    if (players.length === 0) {
      throw new Error("Nenhum jogador encontrado")
    }

    // Calculate prizes (70% for 1st, 20% for 2nd, 10% for 3rd)
    const prizeDistribution = [0.7, 0.2, 0.1]
    const totalPrize = game.prize_pool

    // Update player positions and distribute prizes
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const position = i + 1
      let prizeAmount = 0

      if (i < 3 && players.length > 1) {
        prizeAmount = totalPrize * prizeDistribution[i]
      } else if (players.length === 1) {
        prizeAmount = totalPrize // Winner takes all if only one player
      }

      // Update player position and prize
      await sql`
        UPDATE game_players 
        SET position = ${position}, prize_amount = ${prizeAmount}
        WHERE game_id = ${gameId} AND user_id = ${player.user_id}
      `

      // Get player's wallet
      const [wallet] = await sql`
        SELECT id FROM wallets 
        WHERE user_id = ${player.user_id} AND currency = 'AOA'
      `

      if (prizeAmount > 0) {
        // Create prize transaction
        await sql`
          INSERT INTO transactions (wallet_id, tx_type, amount, currency, status, meta)
          VALUES (${wallet.id}, 'prize', ${prizeAmount}, 'AOA', 'completed', ${JSON.stringify({ game_id: gameId, position })})
        `

        // Add prize to balance
        await sql`
          UPDATE wallets 
          SET balance = balance + ${prizeAmount}
          WHERE id = ${wallet.id}
        `
      }

      // Unlock entry fee (subtract from locked balance)
      await sql`
        UPDATE wallets 
        SET locked_balance = locked_balance - ${game.entry_fee}
        WHERE id = ${wallet.id}
      `
    }

    // Mark game as finished
    await sql`
      UPDATE games 
      SET status = 'finished', finished_at = NOW()
      WHERE id = ${gameId}
    `

    await sql`COMMIT`
    return players
  } catch (error) {
    await sql`ROLLBACK`
    throw error
  }
}

export async function getGameDetails(gameId: string) {
  const [game] = await sql`
    SELECT g.*, 
           (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players
    FROM games g
    WHERE g.id = ${gameId}
  `

  if (!game) return null

  const players = await sql`
    SELECT gp.*, u.username
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = ${gameId}
    ORDER BY gp.score DESC
  `

  return { ...game, players }
}

export async function getAvailableGames(limit = 10) {
  const games = await sql`
    SELECT g.id, g.entry_fee, g.max_players, g.created_at,
           (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players,
           u.username as host_username
    FROM games g
    JOIN users u ON g.host_id = u.id
    WHERE g.status = 'pending'
    ORDER BY g.created_at DESC
    LIMIT ${limit}
  `

  return games
}
