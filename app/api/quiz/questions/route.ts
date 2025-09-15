import { type NextRequest, NextResponse } from "next/server"
import { getRandomQuestions } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

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

    const { searchParams } = new URL(request.url)
    const count = Number.parseInt(searchParams.get("count") || "10")
    const difficulty = searchParams.get("difficulty") ? Number.parseInt(searchParams.get("difficulty")!) : undefined
    const category = searchParams.get("category") || undefined

    const questions = await getRandomQuestions(count, difficulty, category)

    // Remove correct answers from response for security
    const questionsForClient = questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      category: q.category,
    }))

    return NextResponse.json({
      success: true,
      questions: questionsForClient,
    })
  } catch (error) {
    console.error("Get questions error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
