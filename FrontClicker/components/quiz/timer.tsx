"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Pause } from "lucide-react"

interface TimerProps {
  // משך השאלה הכולל (למשל 20) - משמש רק לחישוב אחוז ההתקדמות של הטבעת
  totalSeconds: number
  // הזמן שנותר בפועל, כפי שמגיע משידור /topic/timer מה-QuizTimerService בשרת.
  // זהו מקור האמת היחיד - אין יותר ספירה מקומית בדפדפן, ולכן כולם (מנהל ומשתתפים) רואים בדיוק אותו מספר
  timeLeft: number
  // רק לצורך ויזואלי (עמעום + אייקון פאוזה) - ההקפאה בפועל קורית כי השרת מפסיק לשלוח טיקים חדשים
  isPaused?: boolean
}

export function Timer({ totalSeconds, timeLeft, isPaused = false }: TimerProps) {
  const clampedTimeLeft = Math.max(0, Math.min(timeLeft, totalSeconds))
  const progress = totalSeconds > 0 ? (clampedTimeLeft / totalSeconds) * 100 : 0
  const isUrgent = clampedTimeLeft <= 5

  return (
    <div className={`relative flex flex-col items-center gap-4 transition-opacity duration-300 ${isPaused ? "opacity-60" : "opacity-100"}`}>
      {/* Circular timer */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isUrgent ? "#ff4466" : "#00ddff"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} 283`}
            style={{
              filter: `drop-shadow(0 0 10px ${isUrgent ? "#ff4466" : "#00ddff"})`,
            }}
            animate={{
              strokeDasharray: `${progress * 2.83} 283`,
            }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer text / pause icon */}
        <AnimatePresence mode="wait">
          {isPaused ? (
            <motion.div
              key="paused"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Pause className="w-10 h-10 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px #00ddff)" }} />
            </motion.div>
          ) : (
            <motion.div
              key={clampedTimeLeft}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span
                className={`text-5xl font-bold ${
                  isUrgent ? "text-red-400" : "text-cyan-300"
                }`}
                style={{
                  textShadow: `0 0 20px ${isUrgent ? "#ff4466" : "#00ddff"}`,
                }}
              >
                {clampedTimeLeft}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing ring when urgent (not while paused) */}
        {isUrgent && !isPaused && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-400"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-3 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isUrgent
              ? "bg-gradient-to-r from-red-500 to-orange-500"
              : "bg-gradient-to-r from-cyan-400 to-pink-400"
          }`}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          style={{
            boxShadow: `0 0 15px ${isUrgent ? "#ff4466" : "#00ddff"}`,
          }}
        />
      </div>
    </div>
  )
}