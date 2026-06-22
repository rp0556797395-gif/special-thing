"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"
import confetti from "canvas-confetti"
import { Participant } from "@/hooks/use-quiz-websocket";

interface WinnerOverlayProps {
  // winner: {
  //   phone: string
  //   name?: string
  //   score: number
  // }
  winner: Participant;
  onClose: () => void
}

export function WinnerOverlay({ winner, onClose }: WinnerOverlayProps) {
  useEffect(() => {
    // Fire confetti
    const duration = 5000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ff4488", "#00ccff", "#00ff88", "#ffaa00", "#ff00ff"],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ff4488", "#00ccff", "#00ff88", "#ffaa00", "#ff00ff"],
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />



      {/* Winner card */}
      
      <motion.div
        className="relative z-10 max-w-lg w-full mx-4"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >


        {/* Glowing background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-2xl opacity-50 animate-pulse" />
        
        <div className="relative glass rounded-3xl p-8 text-center overflow-hidden">
          {/* Trophy icon */}
          <motion.div
            className="w-32 h-32 mx-auto mb-6 relative"
            animate={{
              y: [-5, 5, -5],
              rotate: [-5, 5, -5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="relative w-full h-full"
            >
              <path
                d="M12 15a6 6 0 006-6V4H6v5a6 6 0 006 6z"
                fill="url(#trophy-gradient)"
              />
              <path d="M6 4H4v3a3 3 0 003 3h1V4z" fill="url(#trophy-gradient)" />
              <path d="M18 4h2v3a3 3 0 01-3 3h-1V4z" fill="url(#trophy-gradient)" />
              <path d="M9 22h6v-5a3 3 0 00-6 0v5z" fill="url(#trophy-gradient)" />
              <path d="M7 22h10v-2H7v2z" fill="url(#trophy-gradient)" />
              <defs>
                <linearGradient
                  id="trophy-gradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#ff8c00" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Winner text */}
          {/* Winner text */}
          <motion.h1
            className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0%", "100%", "0%"],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundSize: "200% 100%" }}
          >
            WINNER!
          </motion.h1>

          {/* שיניתי מ-motion.p ל-motion.div כדי למנוע את שגיאת ה-Hydration */}
          <motion.div
            className="text-3xl md:text-4xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* כאן אמור להיות שם הזוכה, למשל: {winner.name} */}

            {/* הוספת מספר הטלפון מתחת לשם - עכשיו זה חוקי כי האבא הוא div */}
            {winner.phoneNumber && (
              <motion.p
                className="text-xl md:text-2xl font-medium text-muted-foreground mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                טלפון: {winner.phoneNumber}
              </motion.p>
            )}
          </motion.div>

          <motion.div
            className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full px-8 py-4 mt-4"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <span className="text-white text-2xl">Score:</span>
            <span className="text-white text-5xl font-black">{winner.score}</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
