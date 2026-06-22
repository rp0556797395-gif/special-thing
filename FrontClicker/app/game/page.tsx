"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { QuizGame } from "@/components/quiz/quiz-game"

function GameContent() {
  const searchParams = useSearchParams()
  
  const serverUrl = searchParams.get("server") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  const eventName = searchParams.get("event") || "יום הולדת 70 פנירי"
  const eventSlogan = searchParams.get("slogan") || "Test Your Knowledge!"
  const adminKey = searchParams.get("adminKey")
  return (
    <QuizGame
      serverUrl={serverUrl}
      eventName={eventName}
      eventSlogan={eventSlogan}
      adminKey={adminKey || undefined}
    />
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        fontSize: 24,
        fontWeight: 700,
      }}>
        Loading Quiz...
      </div>
    }>
      <GameContent />
    </Suspense>
  )
}
